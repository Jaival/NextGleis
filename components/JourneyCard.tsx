import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { countdownLabel, Countdown } from './Countdown';
import { LineBar } from './LineBar';
import { PlatformTile } from './PlatformTile';
import { PressableScale } from './PressableScale';
import { serviceDescription } from './ServicePill';
import { departureStatus } from '@/lib/delay';
import { useT, type Translate } from '@/lib/i18n';
import { formatDuration, formatTime } from '@/lib/time';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { Journey } from '@/types';

function changesLabel(transfers: number, t: Translate): string {
  return transfers === 0 ? t('journey.direct') : t('journey.changes', transfers);
}

// One row per connection, read left to right: the platform to start from, when
// and by which lines, and how long until it leaves. Tapping opens the
// connection's own screen with every change.
function JourneyCardBase({
  journey,
  now,
  onOpen,
}: {
  journey: Journey;
  // The screen's clock; see useNow.
  now: string;
  onOpen: (journey: Journey) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();

  const status = departureStatus(
    { cancelled: journey.cancelled, delayMinutes: journey.departureDelayMinutes },
    colors,
    t,
  );
  const riding = journey.legs.filter((leg) => !leg.walking);
  const first = riding[0];
  const changes = changesLabel(journey.transfers, t);
  const hasNotices = riding.some((leg) => leg.notices?.length);

  const a11yLabel = [
    t('journey.summary', formatTime(journey.departure), formatTime(journey.arrival)),
    journey.cancelled
      ? null
      : countdownLabel(journey.departure, journey.departureDelayMinutes, now, t),
    formatDuration(journey.durationMinutes, t),
    changes,
    status.kind === 'delayed'
      ? t('journey.departureDelayed', journey.departureDelayMinutes ?? 0)
      : status.label,
    first?.departurePlatform ? t('departure.platform', first.departurePlatform) : null,
    hasNotices ? t('journey.hasNotices') : null,
    riding
      .map((leg) =>
        [leg.line, leg.kind ? serviceDescription(leg.kind, t) : null].filter(Boolean).join(', '),
      )
      .join(t('journey.then')),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <PressableScale
      onPress={() => onOpen(journey)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={t('journey.openHint')}
    >
      <PlatformTile
        flush
        tone="sign"
        platform={first?.departurePlatform}
        plannedPlatform={first?.plannedDeparturePlatform}
        kind={first?.kind}
      />

      <View style={styles.body}>
        <Text style={[styles.time, journey.cancelled && styles.timeCancelled]}>
          {formatTime(journey.departure)} – {formatTime(journey.arrival)}
        </Text>
        <LineBar legs={journey.legs} />
        <View style={styles.subline}>
          <Text style={[styles.status, { color: status.fg }]}>{status.label}</Text>
          <Text style={styles.changes} numberOfLines={1}>
            {changes}
          </Text>
          {hasNotices ? <Ionicons name="warning" size={13} color={colors.delay} /> : null}
        </View>
      </View>

      <View style={styles.countdown}>
        <Countdown
          time={journey.departure}
          delayMinutes={journey.departureDelayMinutes}
          now={now}
          cancelled={journey.cancelled}
        />
      </View>
    </PressableScale>
  );
}

// Connections refetch every minute and the clock ticks every 15 seconds;
// without this each tick re-renders every card even when nothing changed
// (only `now` does, and a card shows it in whole minutes).
export const JourneyCard = memo(JourneyCardBase);

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    // The card clips its children so the platform tile can sit flush against the
    // left edge; padding lives on the body, not here.
    card: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      overflow: 'hidden',
    },
    body: { flex: 1, minWidth: 0, padding: spacing.md, gap: spacing.sm, justifyContent: 'center' },
    time: { ...type.time, color: colors.foreground },
    timeCancelled: { textDecorationLine: 'line-through', color: colors.mutedForeground },
    subline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    status: { ...type.captionBold },
    changes: { ...type.caption, color: colors.mutedForeground, flexShrink: 1 },
    countdown: { paddingRight: spacing.md, justifyContent: 'center' },
  });
}
