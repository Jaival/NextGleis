import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrivalListItem } from '@/components/ArrivalListItem';
import { BoardSkeleton } from '@/components/BoardSkeleton';
import { Chip } from '@/components/Chip';
import { DepartureListItem } from '@/components/DepartureListItem';
import { DirectionSheet } from '@/components/DirectionSheet';
import { DisruptionBanner } from '@/components/DisruptionBanner';
import { EmptyState } from '@/components/EmptyState';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { getArrivals, getBoard } from '@/lib/api';
import { toggleDirection, useFavoritesStore } from '@/lib/favoritesStore';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { needsLongDistanceTicket } from '@/lib/product';
import { useSettingsStore } from '@/lib/settingsStore';
import { duration, easing, spring } from '@/lib/motion';
import { boardWarnings } from '@/lib/notices';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { ArrivalRow, DepartureRow, HiddenDirection } from '@/types';

type Mode = 'departures' | 'arrivals';
type Row = DepartureRow | ArrivalRow;

// A window starting at the last row's minute repeats the rows of that minute,
// and HAFAS adds delayed services planned a little before the start — so
// pages are merged rather than appended: deduplicated, then back in order.
function rowKey(row: Row): string {
  const towards = 'direction' in row ? row.direction : row.origin;
  return row.tripId ?? `${row.line}|${towards}|${row.scheduledTime}`;
}

function mergePages(pages: Row[][]): Row[] {
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const row of pages.flat()) {
    const key = rowKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export default function BoardScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const t = useT();
  const router = useRouter();
  const { evaNo, name } = useLocalSearchParams<{ evaNo: string; name?: string }>();
  const favorites = useFavoritesStore((s) => s.favorites);
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const toggleHiddenLine = useFavoritesStore((s) => s.toggleHiddenLine);
  const toggleHiddenDirection = useFavoritesStore((s) => s.toggleHiddenDirection);

  const favorite = favorites.find((f) => f.evaNo === evaNo);
  const isFavorite = Boolean(favorite);
  const stationName = favorite?.name ?? name ?? t('board.fallbackTitle');

  const [sessionHidden, setSessionHidden] = useState<string[]>([]);
  const hiddenLines = favorite?.hiddenLines ?? sessionHidden;
  const [sessionDirections, setSessionDirections] = useState<HiddenDirection[]>([]);
  const hiddenDirections = favorite?.hiddenDirections ?? sessionDirections;
  const [directionLine, setDirectionLine] = useState('');
  const [choosingDirections, setChoosingDirections] = useState(false);

  const [mode, setMode] = useState<Mode>('departures');
  const modeOptions = useMemo(
    () => [
      { value: 'departures' as const, label: t('board.departures') },
      { value: 'arrivals' as const, label: t('board.arrivals') },
    ],
    [t],
  );

  // Each page is a two-hour window; `null` is the one starting now, and the
  // next starts at the minute of the last row so far.
  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchStatus,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['board', mode, evaNo],
    queryFn: ({ pageParam, signal }): Promise<Row[]> =>
      mode === 'departures'
        ? getBoard(evaNo, pageParam, signal)
        : getArrivals(evaNo, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last, _pages, lastParam) => {
      const next = last.at(-1)?.scheduledTime.slice(0, 16);
      // An empty window, or one that didn't get past its own start (a stop
      // whose sources can't look ahead), has nothing later to offer.
      return next && next > (lastParam ?? '') ? next : undefined;
    },
    refetchInterval: 30_000,
  });
  const isOffline = fetchStatus === 'paused';
  const merged = useMemo(() => mergePages(data?.pages ?? []), [data]);

  // Deutschlandticket mode drops long-distance trains before anything else,
  // so they don't get filter chips either.
  const deutschlandticket = useSettingsStore((s) => s.deutschlandticket);
  const rows = useMemo(
    () => (deutschlandticket ? merged.filter((row) => !needsLongDistanceTicket(row.line)) : merged),
    [merged, deutschlandticket],
  );
  const longDistanceHidden = merged.length - rows.length;

  const lines = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) if (row.line) set.add(row.line);
    return Array.from(set).sort();
  }, [rows]);

  // Direction filters are about where a departure goes, so they only apply
  // to the departures board; an arrival's "where from" is a different list.
  const isDirectionHidden = useCallback(
    (line: string, direction: string) =>
      hiddenDirections.some((h) => h.line === line && h.direction === direction),
    [hiddenDirections],
  );
  const visibleRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          !hiddenLines.includes(row.line) &&
          !('direction' in row && isDirectionHidden(row.line, row.direction)),
      ),
    [rows, hiddenLines, isDirectionHidden],
  );

  // Every direction the line has on this board, plus any hidden earlier that
  // isn't running right now — otherwise it could never be brought back.
  const lineDirections = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.line === directionLine && 'direction' in row && row.direction) set.add(row.direction);
    }
    for (const h of hiddenDirections) if (h.line === directionLine) set.add(h.direction);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, hiddenDirections, directionLine]);

  const toggleDirectionOf = (direction: string) => {
    const hidden = { line: directionLine, direction };
    if (isFavorite) toggleHiddenDirection(evaNo, hidden);
    else setSessionDirections((prev) => toggleDirection(prev, hidden));
  };

  const showAllDirections = () => {
    for (const h of hiddenDirections) if (h.line === directionLine) toggleDirectionOf(h.direction);
  };

  const openTrip = useCallback(
    (row: Row) => {
      if (!row.tripId) return;
      router.push({
        pathname: '/trip/[id]',
        // `at` and `side` pick out this stop among the trip's stops: the one
        // whose departure (or arrival) is this row's time.
        params: { id: row.tripId, line: row.line, at: row.scheduledTime, side: mode },
      });
    },
    [router, mode],
  );

  // Only for the lines on show: a diversion of a hidden tram isn't news.
  const warnings = useMemo(() => boardWarnings(visibleRows), [visibleRows]);

  const toggleLine = (line: string) => {
    if (isFavorite) {
      toggleHiddenLine(evaNo, line);
    } else {
      setSessionHidden((prev) =>
        prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line],
      );
    }
  };

  // Starring a station is a rare, deliberate act — the tier where a bit of
  // delight is affordable. The overshoot is what makes it read as "caught",
  // and the haptic fires on the same frame as the icon fills.
  const starScale = useSharedValue(1);
  const starStyle = useAnimatedStyle(() => ({ transform: [{ scale: starScale.get() }] }));

  const toggleFavorite = () => {
    tap.light();
    if (!reduced) {
      starScale.set(
        withSequence(
          withTiming(1.3, { duration: duration.press, easing: easing.out }),
          withSpring(1, spring.pop),
        ),
      );
    }
    if (isFavorite) {
      removeFavorite(evaNo);
    } else {
      addFavorite({ evaNo, name: stationName });
    }
  };

  return (
    <ScreenContainer edges={[]}>
      <Stack.Screen
        options={{
          title: stationName,
          headerRight: () => (
            <Pressable
              onPress={toggleFavorite}
              accessibilityRole="button"
              accessibilityState={{ selected: isFavorite }}
              accessibilityLabel={
                isFavorite
                  ? t('board.removeFavorite', stationName)
                  : t('board.addFavorite', stationName)
              }
              hitSlop={12}
            >
              <Animated.View style={starStyle}>
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={22}
                  color={isFavorite ? colors.primary : colors.textSecondary}
                />
              </Animated.View>
            </Pressable>
          ),
        }}
      />

      <View style={styles.modeRow}>
        <SegmentedControl
          options={modeOptions}
          value={mode}
          onChange={setMode}
          accessibilityLabel={t('board.modeLabel')}
        />
      </View>

      {lines.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
        >
          {lines.map((line) => (
            <Chip
              key={line}
              label={line}
              active={!hiddenLines.includes(line)}
              onPress={() => toggleLine(line)}
              partial={
                mode === 'departures' &&
                !hiddenLines.includes(line) &&
                hiddenDirections.some((h) => h.line === line)
              }
              onLongPress={
                mode === 'departures'
                  ? () => {
                      setDirectionLine(line);
                      setChoosingDirections(true);
                    }
                  : undefined
              }
              longPressLabel={t('board.chooseDirections', line)}
              accessibilityLabel={
                hiddenLines.includes(line) ? t('board.showLine', line) : t('board.hideLine', line)
              }
            />
          ))}
        </ScrollView>
      ) : null}

      {isLoading && isOffline ? (
        <EmptyState
          fill
          icon="cloud-offline-outline"
          title={t('common.offline')}
          message={t('board.offlineLoading')}
        />
      ) : isLoading ? (
        // No crossfade here on purpose: BoardSkeleton mirrors the row geometry
        // exactly, so real departures land where the placeholders were and the
        // swap needs no motion to cover a jump.
        <BoardSkeleton
          label={mode === 'departures' ? t('board.loading') : t('board.loadingArrivals')}
        />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item, index) => `${item.line}-${item.scheduledTime}-${index}`}
          renderItem={({ item }) =>
            mode === 'departures' ? (
              <DepartureListItem
                row={item as DepartureRow}
                onPress={item.tripId ? openTrip : undefined}
              />
            ) : (
              <ArrivalListItem
                row={item as ArrivalRow}
                onPress={item.tripId ? openTrip : undefined}
              />
            )
          }
          ListHeaderComponent={
            <>
              <DisruptionBanner notices={warnings} />
              {longDistanceHidden > 0 ? (
                <Text style={styles.ticketNote}>
                  {t('board.longDistanceHidden', longDistanceHidden)}
                </Text>
              ) : null}
            </>
          }
          ListFooterComponent={
            visibleRows.length > 0 && hasNextPage ? (
              <LoadMoreButton
                label={
                  mode === 'departures' ? t('board.laterDepartures') : t('board.laterArrivals')
                }
                direction="later"
                loading={isFetchingNextPage}
                disabled={isOffline}
                onPress={() => fetchNextPage()}
              />
            ) : null
          }
          // Android is edge-to-edge, so the list draws behind the navigation
          // bar. Padding the content (rather than insetting the container) lets
          // rows scroll under it while the last row still clears it.
          contentContainerStyle={{ paddingBottom: insets.bottom, flexGrow: 1 }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          refreshControl={
            <RefreshControl
              // isRefetching also covers a page being added, which has its own
              // spinner on the button.
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            isOffline ? (
              <EmptyState
                fill
                icon="cloud-offline-outline"
                title={t('common.offline')}
                message={
                  mode === 'departures' ? t('board.offlineStale') : t('board.offlineStaleArrivals')
                }
              />
            ) : isError ? (
              <EmptyState
                fill
                icon="alert-circle-outline"
                title={t('board.error')}
                message={t('common.pullToRetry')}
              />
            ) : hiddenLines.length > 0 ? (
              <EmptyState
                fill
                icon="filter-outline"
                title={t('board.filteredTitle')}
                message={t('board.filteredMessage')}
              />
            ) : (
              <EmptyState
                fill
                icon="time-outline"
                title={t('board.emptyTitle')}
                message={
                  mode === 'departures' ? t('board.emptyMessage') : t('board.emptyMessageArrivals')
                }
              />
            )
          }
        />
      )}

      <DirectionSheet
        visible={choosingDirections}
        line={directionLine}
        directions={lineDirections}
        hidden={(direction) => isDirectionHidden(directionLine, direction)}
        onToggle={toggleDirectionOf}
        onShowAll={showAllDirections}
        onClose={() => setChoosingDirections(false)}
      />
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    modeRow: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      backgroundColor: colors.background,
    },
    chipRow: {
      flexGrow: 0,
      // Native already never shrinks it; react-native-web does once the list
      // below is long enough, clipping the chips.
      flexShrink: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    ticketNote: {
      ...type.caption,
      color: colors.textTertiary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    chipRowContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
  });
}
