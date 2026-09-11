import { Ionicons } from '@expo/vector-icons';
import { Fragment, memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LineBadge } from './LineBadge';
import { PressableScale } from './PressableScale';
import { SERVICE_DESCRIPTIONS, ServicePill } from './ServicePill';
import { departureStatus } from '@/lib/delay';
import { duration, easing } from '@/lib/motion';
import { formatDuration, formatTime, minutesBetween } from '@/lib/time';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { Journey, JourneyLeg } from '@/types';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Styles = ReturnType<typeof createStyles>;

const DETAILS_IN = FadeIn.duration(duration.fast).easing(easing.out);

function changesLabel(transfers: number): string {
  if (transfers === 0) return 'Direct';
  return `${transfers} change${transfers === 1 ? '' : 's'}`;
}

// The summary carries what a list of connections gets compared on — when, how
// long, how many changes, which lines. Tapping opens the leg-by-leg detail for
// the one the rider settles on.
function JourneyCardBase({ journey }: { journey: Journey }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);

  const status = departureStatus(
    { cancelled: journey.cancelled, delayMinutes: journey.departureDelayMinutes },
    colors,
  );
  const riding = journey.legs.filter((leg) => !leg.walking);
  const changes = changesLabel(journey.transfers);

  const a11yLabel = [
    `Departs ${formatTime(journey.departure)}, arrives ${formatTime(journey.arrival)}`,
    formatDuration(journey.durationMinutes),
    changes,
    status.kind === 'delayed'
      ? `departure delayed ${journey.departureDelayMinutes} minutes`
      : status.label.toLowerCase(),
    riding
      .map((leg) =>
        [leg.line, leg.kind ? SERVICE_DESCRIPTIONS[leg.kind] : null].filter(Boolean).join(', '),
      )
      .join(', then '),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <PressableScale
      onPress={() => setExpanded((open) => !open)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={a11yLabel}
      accessibilityHint={
        expanded ? 'Hides the legs of this connection' : 'Shows each leg of this connection'
      }
    >
      <View style={styles.summary}>
        <Text style={[styles.time, journey.cancelled && styles.timeCancelled]}>
          {formatTime(journey.departure)} – {formatTime(journey.arrival)}
        </Text>
        <Text style={styles.duration}>{formatDuration(journey.durationMinutes)}</Text>
      </View>

      <View style={styles.subline}>
        <Text style={[styles.status, { color: status.fg }]}>{status.label}</Text>
        <Text style={styles.changes}>{changes}</Text>
      </View>

      <View style={styles.badges}>
        {riding.map((leg, index) => (
          <Fragment key={`${leg.line}-${leg.departure}-${index}`}>
            {index > 0 ? (
              <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
            ) : null}
            <LineBadge compact line={leg.line ?? ''} />
          </Fragment>
        ))}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
          style={styles.expandIcon}
        />
      </View>

      {expanded ? (
        <Animated.View entering={DETAILS_IN} style={styles.legs}>
          {journey.legs.map((leg, index) => (
            <LegDetail
              key={`${leg.departure}-${index}`}
              leg={leg}
              styles={styles}
              colors={colors}
            />
          ))}
        </Animated.View>
      ) : null}
    </PressableScale>
  );
}

// Connections refetch every minute; without this each poll re-renders every
// card even when nothing changed.
export const JourneyCard = memo(JourneyCardBase);

function LegDetail({ leg, styles, colors }: { leg: JourneyLeg; styles: Styles; colors: Colors }) {
  if (leg.walking) {
    const minutes = minutesBetween(leg.departure, leg.arrival);
    const where = leg.destination && leg.destination !== leg.origin ? ` to ${leg.destination}` : '';
    return (
      <View style={styles.walk}>
        <Ionicons name="walk-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.walkText} numberOfLines={1}>
          {minutes > 0 ? `Walk ${minutes} min${where}` : `Change${where}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.leg}>
      <View style={styles.legHeader}>
        <LineBadge compact line={leg.line ?? ''} />
        {leg.kind ? <ServicePill kind={leg.kind} /> : null}
        {leg.direction ? (
          <Text style={styles.legDirection} numberOfLines={1}>
            to {leg.direction}
          </Text>
        ) : null}
      </View>
      <StopLine
        time={leg.departure}
        delay={leg.departureDelayMinutes}
        place={leg.origin}
        platform={leg.departurePlatform}
        cancelled={leg.cancelled}
        styles={styles}
        colors={colors}
      />
      <StopLine
        time={leg.arrival}
        delay={leg.arrivalDelayMinutes}
        place={leg.destination}
        platform={leg.arrivalPlatform}
        cancelled={leg.cancelled}
        styles={styles}
        colors={colors}
      />
    </View>
  );
}

function StopLine({
  time,
  delay,
  place,
  platform,
  cancelled,
  styles,
  colors,
}: {
  time: string;
  delay?: number;
  place: string;
  platform?: string;
  cancelled: boolean;
  styles: Styles;
  colors: Colors;
}) {
  return (
    <View style={styles.stopLine}>
      <Text style={[styles.stopTime, cancelled && styles.timeCancelled]}>{formatTime(time)}</Text>
      {delay ? <Text style={[styles.stopDelay, { color: colors.delay }]}>+{delay}</Text> : null}
      <Text style={styles.stopPlace} numberOfLines={1}>
        {place}
      </Text>
      {platform ? <Text style={styles.stopPlatform}>Pl. {platform}</Text> : null}
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      padding: spacing.md,
      gap: spacing.sm,
    },
    summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    time: { ...type.time, color: colors.textPrimary },
    timeCancelled: { textDecorationLine: 'line-through', color: colors.textSecondary },
    duration: { ...type.subheadMedium, color: colors.textSecondary },
    subline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    status: { ...type.captionBold },
    changes: { ...type.caption, color: colors.textTertiary },
    badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
    expandIcon: { marginLeft: 'auto' },
    legs: {
      gap: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    leg: { gap: spacing.xs },
    legHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    legDirection: { flex: 1, ...type.footnote, color: colors.textSecondary },
    stopLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stopTime: { ...type.timeSmall, color: colors.textPrimary, width: 44 },
    stopDelay: { ...type.captionBold },
    stopPlace: { flex: 1, ...type.footnote, color: colors.textPrimary },
    stopPlatform: { ...type.micro, color: colors.textTertiary },
    walk: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    walkText: { flex: 1, ...type.caption, color: colors.textTertiary },
  });
}
