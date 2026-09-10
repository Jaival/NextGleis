import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BoardSkeleton } from '@/components/BoardSkeleton';
import { Chip } from '@/components/Chip';
import { DepartureListItem } from '@/components/DepartureListItem';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getBoard } from '@/lib/api';
import { useFavoritesStore } from '@/lib/favoritesStore';
import { tap } from '@/lib/haptics';
import { duration, easing, spring } from '@/lib/motion';
import { spacing } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

export default function BoardScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { evaNo, name } = useLocalSearchParams<{ evaNo: string; name?: string }>();
  const favorites = useFavoritesStore((s) => s.favorites);
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const toggleHiddenLine = useFavoritesStore((s) => s.toggleHiddenLine);

  const favorite = favorites.find((f) => f.evaNo === evaNo);
  const isFavorite = Boolean(favorite);
  const stationName = favorite?.name ?? name ?? 'Station';

  const [sessionHidden, setSessionHidden] = useState<string[]>([]);
  const hiddenLines = favorite?.hiddenLines ?? sessionHidden;

  const { data, isLoading, isError, isRefetching, refetch, fetchStatus } = useQuery({
    queryKey: ['board', evaNo],
    queryFn: ({ signal }) => getBoard(evaNo, signal),
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
                  ? `Remove ${stationName} from favorites`
                  : `Add ${stationName} to favorites`
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
              accessibilityLabel={`${hiddenLines.includes(line) ? 'Show' : 'Hide'} line ${line}`}
            />
          ))}
        </ScrollView>
      ) : null}

      {isLoading && isOffline ? (
        <EmptyState
          fill
          icon="cloud-offline-outline"
          title="You're offline"
          message="Connect to the internet to load this board."
        />
      ) : isLoading ? (
        // No crossfade here on purpose: BoardSkeleton mirrors the row geometry
        // exactly, so real departures land where the placeholders were and the
        // swap needs no motion to cover a jump.
        <BoardSkeleton />
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item, index) => `${item.line}-${item.scheduledTime}-${index}`}
          renderItem={({ item }) => <DepartureListItem row={item} />}
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
                title="You're offline"
                message="Departures will update once you're back online."
              />
            ) : isError ? (
              <EmptyState
                fill
                icon="alert-circle-outline"
                title="Could not load this board"
                message="Pull down to refresh and try again."
              />
            ) : hiddenLines.length > 0 ? (
              <EmptyState
                fill
                icon="filter-outline"
                title="Everything is filtered out"
                message="Tap a line above to bring its departures back."
              />
            ) : (
              <EmptyState
                fill
                icon="time-outline"
                title="Nothing scheduled"
                message="No departures from this station in the next couple of hours."
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
