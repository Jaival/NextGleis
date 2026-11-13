import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { EmptyState } from '@/components/EmptyState';
import { FavoriteRouteCard } from '@/components/FavoriteRouteCard';
import { FavoriteStationCard } from '@/components/FavoriteStationCard';
import { NearbySection } from '@/components/NearbySection';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SearchField } from '@/components/SearchField';
import { StationSearchResults } from '@/components/StationSearchResults';
import { useFavoriteRoutesStore } from '@/lib/favoriteRoutesStore';
import { useFavoritesStore } from '@/lib/favoritesStore';
import { useT } from '@/lib/i18n';
import { duration, easing } from '@/lib/motion';
import { moveItem } from '@/lib/reorder';
import { useSettingsStore } from '@/lib/settingsStore';
import { spacing, type Theme } from '@/lib/theme';
import { useStationSearch } from '@/lib/useStationSearch';
import { useTheme } from '@/lib/useTheme';

// Layout-animation builders live at module scope: rebuilt inline in JSX they
// allocate on every render. All three self-disable under Reduce Motion via the
// builders' default ReduceMotion.System.
const REFLOW = LinearTransition.duration(duration.base).easing(easing.inOut);
const CARD_OUT = FadeOut.duration(duration.press);
const CARD_IN = FadeIn.duration(duration.fast);
const STAGGER_MS = 35;

// The staggered reveal is the app's launch moment — it plays once, after the
// splash hands over to real content. Coming back to this tab later must not
// replay it: favourites the user already knows about should simply be there.
let launchRevealed = false;

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();
  const onboarded = useSettingsStore((s) => s.onboarded);
  const locationEnabled = useSettingsStore((s) => s.locationEnabled);

  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const reorderFavorites = useFavoritesStore((s) => s.reorderFavorites);

  const favoriteRoutes = useFavoriteRoutesStore((s) => s.favoriteRoutes);
  const removeFavoriteRoute = useFavoriteRoutesStore((s) => s.removeFavoriteRoute);
  const reorderFavoriteRoutes = useFavoriteRoutesStore((s) => s.reorderFavoriteRoutes);

  // Typing in the search field swaps the favourites for matching stops; a
  // stop's board is one tap from there, so it needs no tab of its own.
  const [input, setInput] = useState('');
  const searching = input.trim().length > 0;
  const search = useStationSearch(input, searching);

  const [revealing, setRevealing] = useState(() => !launchRevealed);
  useEffect(() => {
    launchRevealed = true;
    if (!revealing) return;
    // Once the reveal is over, anything added later fades in on its own rather
    // than inheriting a stagger delay meant for a whole list arriving at once.
    const handle = setTimeout(() => setRevealing(false), 600);
    return () => clearTimeout(handle);
  }, [revealing]);

  const sortedStations = useMemo(
    () => [...favorites].sort((a, b) => a.order - b.order),
    [favorites],
  );
  const sortedRoutes = useMemo(
    () => [...favoriteRoutes].sort((a, b) => a.order - b.order),
    [favoriteRoutes],
  );

  const entering = useCallback(
    (index: number) =>
      revealing ? FadeInDown.duration(duration.base).delay(index * STAGGER_MS) : CARD_IN,
    [revealing],
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
        // The timestamp makes reopening the same saved route count as a new
        // request, so it replaces edits made on the Routes screen.
        opened: String(Date.now()),
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

  // First run only. Anyone upgrading with favorites already knows the app.
  if (!onboarded && favorites.length === 0 && favoriteRoutes.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          NextGleis
        </Text>
        <SearchField
          value={input}
          onChangeText={setInput}
          placeholder={t('search.placeholder')}
          accessibilityLabel={t('search.label')}
        />
      </View>

      {searching ? (
        <StationSearchResults
          search={search}
          onSelect={(station) => openBoard(station.evaNo, station.name)}
          idleTitle={t('search.idleTitle')}
          idleMessage={t('search.idleMessage')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {locationEnabled ? (
            <Section title={t('nearby.title')} count={0} styles={styles}>
              <NearbySection onOpen={(stop) => openBoard(stop.evaNo, stop.name)} />
            </Section>
          ) : null}

          <Section title={t('home.stations')} count={sortedStations.length} styles={styles}>
            {sortedStations.length === 0 ? (
              <EmptyState
                icon="train-outline"
                title={t('home.noStations')}
                message={t('home.noStationsMessage')}
              />
            ) : (
              sortedStations.map((station, index) => (
                <Animated.View
                  key={station.evaNo}
                  entering={entering(index)}
                  exiting={CARD_OUT}
                  layout={REFLOW}
                  style={styles.cardSlot}
                >
                  <FavoriteStationCard
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
                </Animated.View>
              ))
            )}
          </Section>

          <Section title={t('home.routes')} count={sortedRoutes.length} styles={styles}>
            {sortedRoutes.length === 0 ? (
              <EmptyState
                icon="git-network-outline"
                title={t('home.noRoutes')}
                message={t('home.noRoutesMessage')}
              />
            ) : (
              sortedRoutes.map((route, index) => (
                <Animated.View
                  key={route.id}
                  entering={entering(index)}
                  exiting={CARD_OUT}
                  layout={REFLOW}
                  style={styles.cardSlot}
                >
                  <FavoriteRouteCard
                    favorite={route}
                    onPress={() => openRoute(route)}
                    onMoveUp={index > 0 ? () => moveRoute(index, index - 1) : undefined}
                    onMoveDown={
                      index < sortedRoutes.length - 1
                        ? () => moveRoute(index, index + 1)
                        : undefined
                    }
                    onRemove={() => removeFavoriteRoute(route.id)}
                  />
                </Animated.View>
              ))
            )}
          </Section>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

function Section({
  title,
  count,
  styles,
  children,
}: {
  title: string;
  count: number;
  styles: ReturnType<typeof createStyles>;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
        {count > 0 ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    scroll: { paddingTop: spacing.sm, paddingBottom: spacing.xxl, flexGrow: 1 },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    title: { ...type.largeTitle, color: colors.foreground },
    section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...type.overline,
      color: colors.mutedForeground,
      textTransform: 'uppercase',
    },
    countPill: {
      minWidth: 20,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radii.pill,
      backgroundColor: colors.muted,
      alignItems: 'center',
    },
    countText: { ...type.microBold, color: colors.mutedForeground },
    cardSlot: { marginBottom: spacing.sm },
  });
}
