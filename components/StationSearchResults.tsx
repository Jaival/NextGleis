import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { StationResultItem } from './StationResultItem';
import { useT } from '@/lib/i18n';
import { spacing } from '@/lib/theme';
import type { StationSearch } from '@/lib/useStationSearch';
import { useThemeColors } from '@/lib/useThemeColors';
import type { StationSearchResult } from '@/types';

type Props = {
  search: StationSearch;
  onSelect: (station: StationSearchResult) => void;
  idleTitle: string;
  idleMessage: string;
  itemLabel?: (station: StationSearchResult) => string;
};

export function StationSearchResults({
  search,
  onSelect,
  idleTitle,
  idleMessage,
  itemLabel,
}: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(), []);
  const t = useT();
  const { debounced, tooShort, data, isFetching, isError, isOffline } = search;

  return (
    <>
      {/* Fixed-height slot: the spinner appears and disappears on every
          keystroke, and letting it push the results list would make the whole
          screen twitch while typing. */}
      <View style={styles.status}>
        {isFetching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      <FlatList
        data={tooShort ? [] : (data ?? [])}
        keyExtractor={(item) => item.evaNo}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <StationResultItem
            station={item}
            onPress={() => onSelect(item)}
            accessibilityLabel={itemLabel?.(item) ?? t('search.itemLabel', item.name)}
          />
        )}
        ListEmptyComponent={
          isFetching ? null : tooShort ? (
            <EmptyState icon="search-outline" title={idleTitle} message={idleMessage} />
          ) : isOffline ? (
            <EmptyState
              icon="cloud-offline-outline"
              title={t('common.offline')}
              message={t('search.offlineMessage')}
            />
          ) : isError ? (
            <EmptyState
              icon="alert-circle-outline"
              title={t('search.errorTitle')}
              message={t('search.errorMessage')}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title={t('search.noMatches')}
              message={t('search.noMatchesMessage', debounced)}
            />
          )
        }
      />
    </>
  );
}

function createStyles() {
  return StyleSheet.create({
    status: { height: 28, alignItems: 'center', justifyContent: 'center' },
    list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  });
}
