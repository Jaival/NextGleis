import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StationResultItem } from '@/components/StationResultItem';
import { searchStations } from '@/lib/api';
import { radii, spacing, type } from '@/lib/theme';
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
        <TextInput
          style={styles.input}
          placeholder="Station name, e.g. Frankfurt Hbf"
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={setInput}
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Station name search"
          returnKeyType="search"
        />
      </View>
      {isFetching ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
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
          !isFetching ? (
            <View style={styles.empty} accessibilityLiveRegion="polite">
              <Text style={styles.emptyText}>
                {debounced.length < 2
                  ? 'Type at least 2 letters of a station name.'
                  : isOffline
                    ? "You're offline. Connect to the internet to search stations."
                    : isError
                      ? 'Could not load results. Check your connection and try again.'
                      : 'No stations matched your search.'}
              </Text>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    title: { ...type.title, color: colors.textPrimary, marginBottom: spacing.md },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...type.input,
      color: colors.textPrimary,
    },
    loading: { marginTop: spacing.sm },
    list: { paddingBottom: spacing.xl, flexGrow: 1 },
    empty: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, alignItems: 'center' },
    emptyText: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  });
}
