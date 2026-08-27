import { useCallback } from 'react';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { FavoriteStationCard } from '../../components/FavoriteStationCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useFavoritesStore } from '../../lib/favoritesStore';
import { colors, spacing } from '../../lib/theme';

export default function HomeScreen() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const reorderFavorites = useFavoritesStore((s) => s.reorderFavorites);

  const sorted = [...favorites].sort((a, b) => a.order - b.order);

  const openBoard = useCallback((evaNo: string, name: string) => {
    router.push({ pathname: '/board/[evaNo]', params: { evaNo, name } });
  }, []);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const ids = sorted.map((f) => f.evaNo);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderFavorites(ids);
  };

  const moveDown = (index: number) => {
    if (index === sorted.length - 1) return;
    const ids = sorted.map((f) => f.evaNo);
    [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
    reorderFavorites(ids);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>NextGleis</Text>
        <Text style={styles.subtitle}>Your departure boards</Text>
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.evaNo}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <FavoriteStationCard
            favorite={item}
            onPress={() => openBoard(item.evaNo, item.name)}
            onMoveUp={index > 0 ? () => moveUp(index) : undefined}
            onMoveDown={index < sorted.length - 1 ? () => moveDown(index) : undefined}
            onRemove={() => removeFavorite(item.evaNo)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty} accessibilityLiveRegion="polite">
            <Text style={styles.emptyTitle}>No favorite stations yet</Text>
            <Text style={styles.emptyText}>
              Search for a stop and add it here for one-tap access to its board.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  empty: { paddingTop: spacing.xl * 2, alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
