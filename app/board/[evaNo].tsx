import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BoardSkeleton } from '@/components/BoardSkeleton';
import { Chip } from '@/components/Chip';
import { DepartureListItem } from '@/components/DepartureListItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getBoard } from '@/lib/api';
import { useFavoritesStore } from '@/lib/favoritesStore';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

export default function BoardScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
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

  const toggleFavorite = () => {
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
              accessibilityLabel={
                isFavorite
                  ? `Remove ${stationName} from favorites`
                  : `Add ${stationName} to favorites`
              }
              hitSlop={8}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={22}
                color={colors.primary}
              />
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
        <View style={styles.center} accessibilityLiveRegion="polite">
          <Text style={styles.emptyText}>
            You&apos;re offline. Connect to the internet to load this board.
          </Text>
        </View>
      ) : isLoading ? (
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
            <View style={styles.center} accessibilityLiveRegion="polite">
              <Text style={styles.emptyText}>
                {isOffline
                  ? "You're offline. Departures will update once you're back online."
                  : isError
                    ? 'Could not load this board. Pull to refresh to try again.'
                    : hiddenLines.length > 0
                      ? 'All departures are hidden by your line filters.'
                      : 'No departures in the next couple of hours.'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    chipRow: {
      maxHeight: 48,
      flexGrow: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipRowContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    emptyText: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  });
}
