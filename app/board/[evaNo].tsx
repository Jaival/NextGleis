import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { DisruptionBanner } from '@/components/DisruptionBanner';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { getArrivals, getBoard } from '@/lib/api';
import { useFavoritesStore } from '@/lib/favoritesStore';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { duration, easing, spring } from '@/lib/motion';
import { boardWarnings } from '@/lib/notices';
import { spacing } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { ArrivalRow, DepartureRow } from '@/types';

type Mode = 'departures' | 'arrivals';

export default function BoardScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const t = useT();
  const { evaNo, name } = useLocalSearchParams<{ evaNo: string; name?: string }>();
  const favorites = useFavoritesStore((s) => s.favorites);
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const toggleHiddenLine = useFavoritesStore((s) => s.toggleHiddenLine);

  const favorite = favorites.find((f) => f.evaNo === evaNo);
  const isFavorite = Boolean(favorite);
  const stationName = favorite?.name ?? name ?? t('board.fallbackTitle');

  const [sessionHidden, setSessionHidden] = useState<string[]>([]);
  const hiddenLines = favorite?.hiddenLines ?? sessionHidden;

  const [mode, setMode] = useState<Mode>('departures');
  const modeOptions = useMemo(
    () => [
      { value: 'departures' as const, label: t('board.departures') },
      { value: 'arrivals' as const, label: t('board.arrivals') },
    ],
    [t],
  );

  const { data, isLoading, isError, isRefetching, refetch, fetchStatus } = useQuery({
    queryKey: ['board', mode, evaNo],
    queryFn: ({ signal }): Promise<(DepartureRow | ArrivalRow)[]> =>
      mode === 'departures' ? getBoard(evaNo, signal) : getArrivals(evaNo, signal),
    refetchInterval: 30_000,
  });
  const isOffline = fetchStatus === 'paused';

  const lines = useMemo(() => {
    const set = new Set<string>();
    for (const row of data ?? []) if (row.line) set.add(row.line);
    return Array.from(set).sort();
  }, [data]);

  const visibleRows = useMemo(
    () => (data ?? []).filter((row) => !hiddenLines.includes(row.line)),
    [data, hiddenLines],
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
              <DepartureListItem row={item as DepartureRow} />
            ) : (
              <ArrivalListItem row={item as ArrivalRow} />
            )
          }
          ListHeaderComponent={<DisruptionBanner notices={warnings} />}
          // Android is edge-to-edge, so the list draws behind the navigation
          // bar. Padding the content (rather than insetting the container) lets
          // rows scroll under it while the last row still clears it.
          contentContainerStyle={{ paddingBottom: insets.bottom, flexGrow: 1 }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    chipRowContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
  });
}
