import { Ionicons } from '@expo/vector-icons';
import { Fragment, memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineBadge } from './LineBadge';
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

// The summary carries what a list of connections gets compared on — when, how
// long, how many changes, which lines, and the platform to start from. Tapping
// opens the connection's own screen with every change.
function JourneyCardBase({
  journey,
  onOpen,
}: {
  journey: Journey;
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
      <View style={styles.summary}>
        <Text style={[styles.time, journey.cancelled && styles.timeCancelled]}>
          {formatTime(journey.departure)} – {formatTime(journey.arrival)}
        </Text>
        <Text style={styles.duration}>{formatDuration(journey.durationMinutes, t)}</Text>
      </View>

      <View style={styles.subline}>
        <Text style={[styles.status, { color: status.fg }]}>{status.label}</Text>
        <Text style={styles.changes}>{changes}</Text>
        {hasNotices ? <Ionicons name="warning" size={13} color={colors.delay} /> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.badges}>
          {riding.map((leg, index) => (
            <Fragment key={`${leg.line}-${leg.departure}-${index}`}>
              {index > 0 ? (
                <Ionicons name="chevron-forward" size={12} color={colors.mutedForeground} />
              ) : null}
              <LineBadge compact line={leg.line ?? ''} />
            </Fragment>
          ))}
        </View>
        {first?.departurePlatform ? (
          <Text style={[styles.platform, first.plannedDeparturePlatform && styles.platformChanged]}>
            {t('departure.platformShort', first.departurePlatform)}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </View>
    </PressableScale>
  );
}

// Connections refetch every minute; without this each poll re-renders every
// card even when nothing changed.
export const JourneyCard = memo(JourneyCardBase);

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      padding: spacing.md,
      gap: spacing.sm,
    },
    summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    time: { ...type.time, color: colors.foreground },
    timeCancelled: { textDecorationLine: 'line-through', color: colors.mutedForeground },
    duration: { ...type.subheadMedium, color: colors.mutedForeground },
    subline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    status: { ...type.captionBold },
    changes: { ...type.caption, color: colors.mutedForeground },
    footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    badges: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    platform: { ...type.footnoteMedium, color: colors.mutedForeground },
    platformChanged: { color: colors.delay },
  });
}
