import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Countdown, countdownLabel } from './Countdown';
import { FavoriteCard } from './FavoriteCard';
import { useT } from '@/lib/i18n';
import { nextJourney } from '@/lib/journeySteps';
import { useSettingsStore } from '@/lib/settingsStore';
import { addMinutes, formatTime } from '@/lib/time';
import { spacing, type Theme } from '@/lib/theme';
import { useJourneys } from '@/lib/useJourneys';
import { useTheme } from '@/lib/useTheme';
import type { FavoriteRoute, Journey } from '@/types';

type Props = {
  favorite: FavoriteRoute;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  // Search for the next connection and show it on the card. Each live card is
  // one journey search per minute, so the screen turns it on for a few only.
  live: boolean;
  // The screen's clock; see useNow.
  now: string;
};

export function FavoriteRouteCard({ live, ...props }: Props) {
  return live ? <LiveRouteCard {...props} /> : <RouteCardView {...props} next={undefined} />;
}

// Hooks cannot be conditional, so the search lives in its own component that is
// rendered only for a live card. It runs the same search as the Routes screen
// (same query key): tapping the card finds that list already loaded.
function LiveRouteCard(props: Omit<Props, 'live'>) {
  const { fromEva, toEva } = props.favorite;
  const regionalOnly = useSettingsStore((s) => s.deutschlandticket);
  const isFocused = useIsFocused();
  const { journeys } = useJourneys(
    { fromId: fromEva, toId: toEva, when: null, arrival: false, regionalOnly },
    isFocused,
  );
  // While loading, offline, on error or with nothing to catch there is no next
  // connection, and the card looks like a card that is not live.
  return <RouteCardView {...props} next={nextJourney(journeys, props.now)} />;
}

function RouteCardView({
  favorite,
  onPress,
  onMoveUp,
  onMoveDown,
  onRemove,
  now,
  next,
}: Omit<Props, 'live'> & { next: Journey | undefined }) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();
  const label = t('favorites.routeLabel', favorite.fromName, favorite.toName);

  // `nextJourney` guarantees a ride. The platform and line are the train's; the
  // countdown is to the connection's own start, which is earlier when it begins
  // with a walk (when to set off, as on the Routes list).
  const ride = next?.legs.find((leg) => !leg.walking);
  const platform = ride?.departurePlatform;
  const plannedPlatform = ride?.plannedDeparturePlatform;
  // The time is when the train leaves with its delay, what the rider has to catch.
  // The countdown beside it counts to the connection's start, so the two differ
  // when a walk comes first.
  const trainTime = ride
    ? formatTime(addMinutes(ride.departure, ride.departureDelayMinutes ?? 0))
    : '';

  const openLabel =
    next && ride
      ? [
          t('favorites.openRoute', label),
          ride.line,
          platform
            ? plannedPlatform
              ? t('departure.platformChanged', platform, plannedPlatform)
              : t('departure.platform', platform)
            : null,
          countdownLabel(next.departure, next.departureDelayMinutes, now, t),
        ]
          .filter(Boolean)
          .join('. ')
      : t('favorites.openRoute', label);

  return (
    <FavoriteCard
      itemLabel={label}
      openLabel={openLabel}
      onPress={onPress}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
      tile={next && ride ? { tone: 'sign', platform, plannedPlatform, kind: ride.kind } : undefined}
    >
      <Text style={styles.name} numberOfLines={1}>
        {favorite.fromName}
      </Text>
      <View style={styles.leg}>
        <Ionicons name="arrow-down" size={12} color={colors.mutedForeground} />
        <Text style={styles.name} numberOfLines={1}>
          {favorite.toName}
        </Text>
      </View>
      {next ? (
        // The countdown shares this row, not a column of its own: the names above
        // keep the full width of the card.
        <View style={styles.next}>
          {/* The line gives way to a narrow card, the time does not: it is the part to read. */}
          <View style={styles.train}>
            {ride?.line ? (
              <Text style={styles.trainText} numberOfLines={1}>
                {ride.line} ·{' '}
              </Text>
            ) : null}
            <Text style={[styles.trainText, styles.trainTime]}>{trainTime}</Text>
          </View>
          <Countdown time={next.departure} delayMinutes={next.departureDelayMinutes} now={now} />
        </View>
      ) : null}
    </FavoriteCard>
  );
}

function createStyles({ colors, type }: Theme) {
  return StyleSheet.create({
    name: { ...type.subheadMedium, color: colors.foreground, flexShrink: 1 },
    leg: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    next: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    train: { flexDirection: 'row', flexShrink: 1 },
    trainText: { ...type.caption, color: colors.mutedForeground, flexShrink: 1 },
    trainTime: { flexShrink: 0 },
  });
}
