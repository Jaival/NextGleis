import { Ionicons } from '@expo/vector-icons';
import { Fragment, memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LineBadge } from './LineBadge';
import { NoticeLine } from './NoticeLine';
import { PressableScale } from './PressableScale';
import { ServicePill, serviceDescription } from './ServicePill';
import { departureStatus } from '@/lib/delay';
import { useT, type Translate } from '@/lib/i18n';
import { duration, easing } from '@/lib/motion';
import { formatDuration, formatTime, minutesBetween } from '@/lib/time';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { Journey, JourneyLeg } from '@/types';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Styles = ReturnType<typeof createStyles>;

const DETAILS_IN = FadeIn.duration(duration.fast).easing(easing.out);

function changesLabel(transfers: number, t: Translate): string {
  return transfers === 0 ? t('journey.direct') : t('journey.changes', transfers);
}

// The summary carries what a list of connections gets compared on — when, how
// long, how many changes, which lines. Tapping opens the leg-by-leg detail for
// the one the rider settles on.
function JourneyCardBase({ journey }: { journey: Journey }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const status = departureStatus(
    { cancelled: journey.cancelled, delayMinutes: journey.departureDelayMinutes },
    colors,
    t,
  );
  const riding = journey.legs.filter((leg) => !leg.walking);
  const changes = changesLabel(journey.transfers, t);
  const hasNotices = riding.some((leg) => leg.notices?.length);

  const a11yLabel = [
    t('journey.summary', formatTime(journey.departure), formatTime(journey.arrival)),
    formatDuration(journey.durationMinutes, t),
    changes,
    status.kind === 'delayed'
      ? t('journey.departureDelayed', journey.departureDelayMinutes ?? 0)
      : status.label,
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
      onPress={() => setExpanded((open) => !open)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={a11yLabel}
      accessibilityHint={expanded ? t('journey.collapseHint') : t('journey.expandHint')}
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
              t={t}
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

function LegDetail({
  leg,
  styles,
  colors,
  t,
}: {
  leg: JourneyLeg;
  styles: Styles;
  colors: Colors;
  t: Translate;
}) {
  if (leg.walking) {
    const minutes = minutesBetween(leg.departure, leg.arrival);
    const where = leg.destination && leg.destination !== leg.origin ? leg.destination : null;
    return (
      <View style={styles.walk}>
        <Ionicons name="walk-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.walkText} numberOfLines={1}>
          {minutes > 0 ? t('journey.walk', minutes, where) : t('journey.change', where)}
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
            {t('departure.to', leg.direction)}
          </Text>
        ) : null}
      </View>
      <StopLine
        time={leg.departure}
        delay={leg.departureDelayMinutes}
        place={leg.origin}
        platform={leg.departurePlatform}
        plannedPlatform={leg.plannedDeparturePlatform}
        cancelled={leg.cancelled}
        styles={styles}
        colors={colors}
        t={t}
      />
      <StopLine
        time={leg.arrival}
        delay={leg.arrivalDelayMinutes}
        place={leg.destination}
        platform={leg.arrivalPlatform}
        plannedPlatform={leg.plannedArrivalPlatform}
        cancelled={leg.cancelled}
        styles={styles}
        colors={colors}
        t={t}
      />
      {leg.notices?.map((notice) => (
        <NoticeLine key={notice.text} notice={notice} lines={3} />
      ))}
    </View>
  );
}

function StopLine({
  time,
  delay,
  place,
  platform,
  plannedPlatform,
  cancelled,
  styles,
  colors,
  t,
}: {
  time: string;
  delay?: number;
  place: string;
  platform?: string;
  plannedPlatform?: string;
  cancelled: boolean;
  styles: Styles;
  colors: Colors;
  t: Translate;
}) {
  return (
    <View style={styles.stopLine}>
      <Text style={[styles.stopTime, cancelled && styles.timeCancelled]}>{formatTime(time)}</Text>
      {delay ? <Text style={[styles.stopDelay, { color: colors.delay }]}>+{delay}</Text> : null}
      <Text style={styles.stopPlace} numberOfLines={1}>
        {place}
      </Text>
      {plannedPlatform ? <Text style={styles.stopPlatformPlanned}>{plannedPlatform}</Text> : null}
      {platform ? (
        <Text style={[styles.stopPlatform, plannedPlatform ? styles.stopPlatformChanged : null]}>
          {t('departure.platformShort', platform)}
        </Text>
      ) : null}
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
    stopPlatformChanged: { ...type.microBold, color: colors.delay },
    stopPlatformPlanned: {
      ...type.micro,
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    walk: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    walkText: { flex: 1, ...type.caption, color: colors.textTertiary },
  });
}
