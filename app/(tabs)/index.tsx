import { useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FavoriteRouteCard } from '@/components/FavoriteRouteCard';
import { FavoriteStationCard } from '@/components/FavoriteStationCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useFavoriteRoutesStore } from '@/lib/favoriteRoutesStore';
import { useFavoritesStore } from '@/lib/favoritesStore';
import { moveItem } from '@/lib/reorder';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

export default function HomeScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const reorderFavorites = useFavoritesStore((s) => s.reorderFavorites);

  const favoriteRoutes = useFavoriteRoutesStore((s) => s.favoriteRoutes);
  const removeFavoriteRoute = useFavoriteRoutesStore((s) => s.removeFavoriteRoute);
  const reorderFavoriteRoutes = useFavoriteRoutesStore((s) => s.reorderFavoriteRoutes);

  const sortedStations = useMemo(
    () => [...favorites].sort((a, b) => a.order - b.order),
    [favorites],
  );
  const sortedRoutes = useMemo(
    () => [...favoriteRoutes].sort((a, b) => a.order - b.order),
    [favoriteRoutes],
  );

  const openBoard = useCallback((evaNo: string, name: string) => {
    router.push({ pathname: '/board/[evaNo]', params: { evaNo, name } });
  }, []);

  const openRoute = useCallback((route: (typeof sortedRoutes)[number]) => {
    router.push({
      pathname: '/routes',
      params: {
        fromEva: route.fromEva,
        fromName: route.fromName,
        toEva: route.toEva,
        toName: route.toName,
      },
    });
  }, []);

  const moveStation = (from: number, to: number) => {
    reorderFavorites(
      moveItem(
        sortedStations.map((f) => f.evaNo),
        from,
        to,
      ),
    );
  };

  const moveRoute = (from: number, to: number) => {
    reorderFavoriteRoutes(
      moveItem(
        sortedRoutes.map((r) => r.id),
        from,
        to,
      ),
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>NextGleis</Text>
          <Text style={styles.subtitle}>Your departure boards and routes</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite routes</Text>
          {sortedRoutes.length === 0 ? (
            <View style={styles.empty} accessibilityLiveRegion="polite">
              <Text style={styles.emptyText}>
                Find a route in the Routes tab and tap the star to save it here.
              </Text>
            </View>
          ) : (
            sortedRoutes.map((route, index) => (
              <FavoriteRouteCard
                key={route.id}
                favorite={route}
                onPress={() => openRoute(route)}
                onMoveUp={index > 0 ? () => moveRoute(index, index - 1) : undefined}
                onMoveDown={
                  index < sortedRoutes.length - 1 ? () => moveRoute(index, index + 1) : undefined
                }
                onRemove={() => removeFavoriteRoute(route.id)}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite stations</Text>
          {sortedStations.length === 0 ? (
            <View style={styles.empty} accessibilityLiveRegion="polite">
              <Text style={styles.emptyText}>
                Search for a stop and add it here for one-tap access to its board.
              </Text>
            </View>
          ) : (
            sortedStations.map((station, index) => (
              <FavoriteStationCard
                key={station.evaNo}
                favorite={station}
                onPress={() => openBoard(station.evaNo, station.name)}
                onMoveUp={index > 0 ? () => moveStation(index, index - 1) : undefined}
                onMoveDown={
                  index < sortedStations.length - 1
                    ? () => moveStation(index, index + 1)
                    : undefined
                }
                onRemove={() => removeFavorite(station.evaNo)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    scroll: { paddingBottom: spacing.xl, flexGrow: 1 },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    title: { ...type.title, color: colors.textPrimary },
    subtitle: { ...type.body, color: colors.textSecondary, marginTop: 2 },
    section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    sectionTitle: {
      ...type.calloutBold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    empty: { paddingVertical: spacing.lg, alignItems: 'center', paddingHorizontal: spacing.md },
    emptyText: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  });
}
