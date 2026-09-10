import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SearchField } from '@/components/SearchField';
import { StationResultItem } from '@/components/StationResultItem';
import { searchStations } from '@/lib/api';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

export default function SearchScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(input.trim()), 300);
    return () => clearTimeout(handle);
  }, [input]);

  const { data, isFetching, isError, fetchStatus } = useQuery({
    queryKey: ['stations', debounced],
    queryFn: ({ signal }) => searchStations(debounced, signal),
    enabled: debounced.length >= 2,
  });
  const isOffline = fetchStatus === 'paused';

  const openBoard = (evaNo: string, name: string) => {
    router.push({ pathname: '/board/[evaNo]', params: { evaNo, name } });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <SearchField
          value={input}
          onChangeText={setInput}
          placeholder="Station name, e.g. Frankfurt Hbf"
          accessibilityLabel="Station name search"
        />
      </View>

      {/* Fixed-height slot: the spinner appears and disappears on every
          keystroke, and letting it push the results list would make the whole
          screen twitch while typing. */}
      <View style={styles.status}>
        {isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.evaNo}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <StationResultItem station={item} onPress={() => openBoard(item.evaNo, item.name)} />
        )}
        ListEmptyComponent={
          isFetching ? null : debounced.length < 2 ? (
            <EmptyState
              icon="search-outline"
              title="Find a station"
              message="Type at least two letters of a station name to see its departures."
            />
          ) : isOffline ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="You're offline"
              message="Connect to the internet to search for stations."
            />
          ) : isError ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Something went wrong"
              message="Could not load results. Check your connection and try again."
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No matches"
              message={`Nothing matched "${debounced}". Try a different spelling.`}
            />
          )
        }
      />
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
    title: { ...type.largeTitle, color: colors.textPrimary },
    status: { height: 28, alignItems: 'center', justifyContent: 'center' },
    list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  });
}
