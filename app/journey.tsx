import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Countdown, countdownLabel } from '@/components/Countdown';
import { EmptyState } from '@/components/EmptyState';
import { LineBadge } from '@/components/LineBadge';
import { NoticeLine } from '@/components/NoticeLine';
import { PlatformTile } from '@/components/PlatformTile';
import { PressableScale } from '@/components/PressableScale';
import { serviceDescription } from '@/components/ServicePill';
import { departureStatus } from '@/lib/delay';
import { useLanguage, useT, type Translate } from '@/lib/i18n';
import { currentRideIndex, journeySteps, type Transfer } from '@/lib/journeySteps';
import { spacing, type Theme, type ThemeColors } from '@/lib/theme';
import { addMinutes, formatDay, formatDuration, formatTime } from '@/lib/time';
import { useJourneys, type JourneySearch } from '@/lib/useJourneys';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/lib/useTheme';
import type { Journey, JourneyLeg } from '@/types';

type Colors = ThemeColors;
type Styles = ReturnType<typeof createStyles>;

// One connection, step by step: which service to board where, when and on
// which platform to get off, and what the change to the next one looks like.
//
// Opened from the Routes list with the search it came from and the
// connection's id; see JourneyDetail for why.
export default function JourneyScreen() {
  const { id, fromId, toId, when, arrival, regional } = useLocalSearchParams<{
    id?: string;
    fromId?: string;
    toId?: string;
    when?: string;
    arrival?: string;
    regional?: string;
  }>();

  const search = useMemo<JourneySearch | null>(() => {
    if (!fromId || !toId) return null;
    const at = when ? new Date(when) : null;
    if (at && Number.isNaN(at.getTime())) return null;
    return { fromId, toId, when: at, arrival: arrival === '1', regionalOnly: regional === '1' };
  }, [fromId, toId, when, arrival, regional]);

  // A link that doesn't name a connection has nothing to show.
  if (!id || !search) return <Redirect href="/routes" />;
  return <JourneyDetail id={id} search={search} />;
}

function JourneyDetail({ id, search }: { id: string; search: JourneySearch }) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const t = useT();
  const language = useLanguage();
  const router = useRouter();
  const isFocused = useIsFocused();
  // One clock for the screen: the countdown and the "now" step move together,
  // and it stops while another screen covers this one.
  const now = useNow(isFocused);

  // The same search the list ran, so the connection is in the cache already
  // and its delays and platforms keep updating while this screen is open.
  const { query, journeys } = useJourneys(search, isFocused);
  const found = journeys.find((journey) => journey.id === id);

  // A search from "now" moves on: once the connection has left, it drops out
  // of the results. The last version seen stays on screen then. The time
  // check guards the ids of networks without stable ones.
  const [journey, setJourney] = useState<Journey | undefined>(found);
  if (
    found &&
    found !== journey &&
    (!journey || (found.departure === journey.departure && found.arrival === journey.arrival))
  ) {
    setJourney(found);
  }

  const steps = useMemo(() => (journey ? journeySteps(journey.legs) : []), [journey]);
  // An index into `steps`: the ride the rider is on or waiting for, -1 once the
  // last ride has arrived.
  const current = currentRideIndex(steps, now);
  const rideSteps = steps.flatMap((step, index) => (step.type === 'ride' ? [index] : []));

  const openTrip = (leg: JourneyLeg) => {
    if (!leg.tripId) return;
    router.push({
      pathname: '/trip/[id]',
      // `at` picks out the stop the rider boards at among the trip's stops.
      params: { id: leg.tripId, line: leg.line, at: leg.departure, side: 'departures' },
    });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t('journey.title') }} />

      {!journey ? (
        query.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState
            fill
            icon="git-network-outline"
            title={t('journey.goneTitle')}
            message={t('journey.goneMessage')}
          />
        )
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Summary journey={journey} language={language} styles={styles} colors={colors} t={t} />

          {/* One segment per ride; the ones already ridden are filled. */}
          <View style={styles.progress} accessible={false}>
            {rideSteps.map((stepIndex) => (
              <View
                key={stepIndex}
                style={[
                  styles.progressSegment,
                  (current === -1 || stepIndex < current) && styles.progressDone,
                ]}
              />
            ))}
          </View>

          {steps.map((step, index) => {
            if (step.type === 'ride') {
              const isNow = index === current;
              // Once the last ride has arrived nothing is "now" and nothing is
              // dimmed: the whole connection is simply behind the rider.
              const passed = current !== -1 && index < current;
              return (
                <Fragment key={index}>
                  {isNow ? <Overline text={t('journey.now')} styles={styles} /> : null}
                  <BoardRow
                    leg={step.leg}
                    isNow={isNow}
                    passed={passed}
                    now={now}
                    onOpen={step.leg.tripId ? () => openTrip(step.leg) : undefined}
                    styles={styles}
                    t={t}
                  />
                  {isNow ? <Overline text={t('journey.next')} styles={styles} /> : null}
                  <ExitRow leg={step.leg} passed={passed} styles={styles} t={t} />
                </Fragment>
              );
            }
            return step.type === 'transfer' ? (
              <Change
                key={index}
                transfer={step.transfer}
                passed={current !== -1 && index < current}
                styles={styles}
                colors={colors}
                t={t}
              />
            ) : (
              <View key={index} style={styles.aside}>
                <Ionicons name="walk-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.asideText, styles.asideWalk]}>
                  {t(
                    'journey.walk',
                    step.minutes,
                    step.leg.destination !== step.leg.origin ? step.leg.destination : null,
                  )}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function Summary({
  journey,
  language,
  styles,
  colors,
  t,
}: {
  journey: Journey;
  language: ReturnType<typeof useLanguage>;
  styles: Styles;
  colors: Colors;
  t: Translate;
}) {
  const status = departureStatus(
    { cancelled: journey.cancelled, delayMinutes: journey.departureDelayMinutes },
    colors,
    t,
  );
  const first = journey.legs[0];
  const last = journey.legs.at(-1);
  // Noon of the departure's calendar day: the same day in Berlin whatever the
  // season, which is all formatDay reads from it.
  const day = formatDay(new Date(`${journey.departure.slice(0, 10)}T12:00:00Z`), language, t);

  return (
    <View style={styles.summary}>
      <Text style={[styles.summaryTime, journey.cancelled && styles.struck]}>
        {formatTime(journey.departure)} – {formatTime(journey.arrival)}
      </Text>
      {first && last ? (
        <Text style={styles.summaryEnds} numberOfLines={2}>
          {first.origin} → {last.destination}
        </Text>
      ) : null}
      <View style={styles.summaryMeta}>
        <Text style={[styles.summaryStatus, { color: status.fg, backgroundColor: status.bg }]}>
          {status.label}
        </Text>
        <Text style={styles.summaryText}>
          {[
            formatDuration(journey.durationMinutes, t),
            journey.transfers === 0 ? t('journey.direct') : t('journey.changes', journey.transfers),
            day === t('routes.today') ? null : day,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </View>
  );
}

function Overline({ text, styles }: { text: string; styles: Styles }) {
  return (
    <Text accessibilityRole="header" style={styles.overline}>
      {text}
    </Text>
  );
}

// A row of the connection: the platform on the left edge, what to do in the
// middle. The card clips its children so the tile sits flush against the edge;
// padding lives on the body.
function StepCard({
  tile,
  right,
  highlight = false,
  passed = false,
  onPress,
  label,
  hint,
  styles,
  children,
}: {
  tile: ReactNode;
  right?: ReactNode;
  highlight?: boolean;
  passed?: boolean;
  onPress?: () => void;
  label: string;
  hint?: string;
  styles: Styles;
  children: ReactNode;
}) {
  const style = [styles.step, highlight && styles.stepNow, passed && styles.stepPassed];
  const content = (
    <>
      {tile}
      <View style={styles.stepBody}>{children}</View>
      {right}
    </>
  );
  return onPress ? (
    <PressableScale
      onPress={onPress}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      {content}
    </PressableScale>
  ) : (
    <View style={style} accessible accessibilityLabel={label}>
      {content}
    </View>
  );
}

// Getting on: the platform to board from, the service, and when it leaves.
// For the ride the rider is on or waiting for this is the yellow card, with
// the countdown.
function BoardRow({
  leg,
  isNow,
  passed,
  now,
  onOpen,
  styles,
  t,
}: {
  leg: JourneyLeg;
  isNow: boolean;
  passed: boolean;
  now: string;
  onOpen?: () => void;
  styles: Styles;
  t: Translate;
}) {
  const delay = !leg.cancelled && leg.departureDelayMinutes ? leg.departureDelayMinutes : 0;
  const platformChanged = Boolean(leg.departurePlatform && leg.plannedDeparturePlatform);
  const label = [
    [leg.line, leg.kind ? serviceDescription(leg.kind, t) : null].filter(Boolean).join(', '),
    leg.direction ? t('departure.to', leg.direction) : null,
    leg.cancelled ? t('status.cancelled') : null,
    `${leg.origin}, ${t('departure.departs', formatTime(leg.departure))}`,
    delay ? t('departure.delayedBy', delay) : null,
    platformChanged
      ? t(
          'departure.platformChanged',
          leg.departurePlatform ?? '',
          leg.plannedDeparturePlatform ?? '',
        )
      : leg.departurePlatform
        ? t('departure.platform', leg.departurePlatform)
        : null,
    isNow && !leg.cancelled ? countdownLabel(leg.departure, delay, now, t) : null,
    ...(leg.notices?.map((notice) => notice.text) ?? []),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <StepCard
      highlight={isNow}
      passed={passed}
      onPress={onOpen}
      label={label}
      hint={onOpen ? t('trip.openHint') : undefined}
      styles={styles}
      tile={
        <PlatformTile
          flush
          tone={isNow ? 'highlight' : 'sign'}
          platform={leg.departurePlatform}
          plannedPlatform={leg.plannedDeparturePlatform}
          kind={leg.kind}
        />
      }
      right={
        isNow ? (
          <View style={styles.stepRight}>
            <Countdown
              tone="highlight"
              time={leg.departure}
              delayMinutes={leg.departureDelayMinutes}
              now={now}
              cancelled={leg.cancelled}
            />
          </View>
        ) : null
      }
    >
      <View style={styles.stepTitleRow}>
        <LineBadge compact line={leg.line ?? ''} />
        {leg.direction ? (
          <Text style={[styles.stepTitle, isNow && styles.onNow]} numberOfLines={2}>
            {t('departure.to', leg.direction)}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.stepMeta, isNow && styles.onNow]} numberOfLines={2}>
        <Text style={leg.cancelled && (isNow ? styles.struckOnNow : styles.struck)}>
          {leg.origin} · {t('departure.departs', formatTime(leg.departure))}
        </Text>
        {delay ? (
          <Text style={isNow ? styles.onNowBold : styles.delayed}>
            {' '}
            {formatTime(addMinutes(leg.departure, delay))} (+{delay})
          </Text>
        ) : null}
      </Text>
      {leg.cancelled ? (
        <Text style={[styles.cancelled, isNow && styles.onNowBold]}>{t('status.cancelled')}</Text>
      ) : null}
      {leg.notices?.map((notice) => (
        <NoticeLine
          key={notice.text}
          notice={notice}
          lines={4}
          tone={isNow ? 'highlight' : 'default'}
        />
      ))}
    </StepCard>
  );
}

// Getting off: the platform to leave by, the stop, and when it arrives.
function ExitRow({
  leg,
  passed,
  styles,
  t,
}: {
  leg: JourneyLeg;
  passed: boolean;
  styles: Styles;
  t: Translate;
}) {
  const delay = !leg.cancelled && leg.arrivalDelayMinutes ? leg.arrivalDelayMinutes : 0;
  const label = [
    t('journey.exit'),
    `${leg.destination}, ${t('departure.arrives', formatTime(leg.arrival))}`,
    delay ? t('departure.delayedBy', delay) : null,
    leg.arrivalPlatform && leg.plannedArrivalPlatform
      ? t('departure.platformChanged', leg.arrivalPlatform, leg.plannedArrivalPlatform)
      : leg.arrivalPlatform
        ? t('departure.platform', leg.arrivalPlatform)
        : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <StepCard
      passed={passed}
      label={label}
      styles={styles}
      tile={
        <PlatformTile
          flush
          label={t('journey.exit')}
          platform={leg.arrivalPlatform}
          plannedPlatform={leg.plannedArrivalPlatform}
          kind={leg.kind}
        />
      }
    >
      <Text style={[styles.stepTitle, leg.cancelled && styles.struck]} numberOfLines={2}>
        {leg.destination}
      </Text>
      <Text style={styles.stepMeta}>
        <Text style={leg.cancelled && styles.struck}>
          {t('departure.arrives', formatTime(leg.arrival))}
        </Text>
        {delay ? (
          <Text style={styles.delayed}>
            {' '}
            {formatTime(addMinutes(leg.arrival, delay))} (+{delay})
          </Text>
        ) : null}
      </Text>
    </StepCard>
  );
}

function Change({
  transfer,
  passed,
  styles,
  colors,
  t,
}: {
  transfer: Transfer;
  passed: boolean;
  styles: Styles;
  colors: Colors;
  t: Translate;
}) {
  const { fromPlatform, toPlatform, status } = transfer;
  const platforms =
    fromPlatform && toPlatform
      ? fromPlatform === toPlatform && !transfer.walkTo
        ? t('journey.samePlatform', toPlatform)
        : t('journey.platformChange', fromPlatform, toPlatform)
      : toPlatform
        ? t('journey.nextPlatform', toPlatform)
        : null;
  const warning =
    status === 'missed' ? t('journey.missed') : status === 'tight' ? t('journey.tight') : null;
  const tint = status === 'missed' ? colors.cancelled : status === 'tight' ? colors.delay : null;

  return (
    <View
      style={[
        styles.aside,
        styles.asideChange,
        passed && styles.stepPassed,
        status === 'tight' && styles.asideTight,
        status === 'missed' && styles.asideMissed,
      ]}
    >
      <Ionicons name="swap-vertical" size={18} color={tint ?? colors.mutedForeground} />
      <View style={styles.asideBody}>
        <Text style={styles.asideTitle}>{t('journey.changeAt', transfer.station)}</Text>
        {/* A change already missed has no time left worth stating. */}
        <Text style={styles.asideText}>
          {[status === 'missed' ? null : t('journey.changeTime', transfer.minutes), platforms]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {transfer.walkMinutes > 0 ? (
          <Text style={styles.asideText}>
            {t('journey.walk', transfer.walkMinutes, transfer.walkTo ?? null)}
          </Text>
        ) : null}
        {warning && tint ? (
          <Text style={[styles.asideWarning, { color: tint }]}>{warning}</Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },

    summary: { gap: spacing.xs, paddingBottom: spacing.sm },
    summaryTime: { ...type.title, color: colors.foreground, fontVariant: ['tabular-nums'] },
    summaryEnds: { ...type.subheadMedium, color: colors.foreground },
    summaryMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    summaryStatus: {
      ...type.captionBold,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.sm,
      overflow: 'hidden',
    },
    summaryText: { ...type.footnote, color: colors.mutedForeground },

    // Progress through the connection: one segment per ride.
    progress: { flexDirection: 'row', gap: 3, paddingBottom: spacing.xs },
    progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: radii.sm,
      backgroundColor: colors.border,
    },
    progressDone: { backgroundColor: colors.primary },
    overline: {
      ...type.overline,
      color: colors.mutedForeground,
      textTransform: 'uppercase',
      marginTop: spacing.xs,
    },

    // The card clips its children so the platform tile sits flush against the
    // left edge; padding lives on the body.
    step: {
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
    // The step the rider is on: the one yellow card on the screen. Every text
    // on it takes `highlightForeground`, because the status colours have no
    // contrast guarantee on this fill.
    stepNow: { backgroundColor: colors.highlight, borderColor: colors.highlight },
    stepPassed: { opacity: 0.55 },
    stepBody: {
      flex: 1,
      minWidth: 0,
      padding: spacing.md,
      gap: spacing.xs,
      justifyContent: 'center',
    },
    stepRight: { paddingRight: spacing.md, justifyContent: 'center' },
    stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stepTitle: { flexShrink: 1, ...type.subheadBold, color: colors.foreground },
    stepMeta: { ...type.footnote, color: colors.mutedForeground },
    onNow: { color: colors.highlightForeground },
    onNowBold: { ...type.footnoteBold, color: colors.highlightForeground },
    delayed: { ...type.footnoteBold, color: colors.delay },
    struck: { textDecorationLine: 'line-through', color: colors.mutedForeground },
    // On the yellow card the line stays but the colour must not change.
    struckOnNow: { textDecorationLine: 'line-through' },
    cancelled: { ...type.captionBold, color: colors.cancelled },

    // Changes and walks sit between the ride cards, off the card surface:
    // they are what happens on the platform, not on a train.
    aside: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderCurve: 'continuous',
    },
    asideChange: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.input },
    asideTight: { backgroundColor: colors.delaySoft },
    asideMissed: { backgroundColor: colors.cancelledSoft },
    asideBody: { flex: 1, gap: 2 },
    asideTitle: { ...type.footnoteBold, color: colors.foreground },
    asideText: { ...type.footnote, color: colors.mutedForeground },
    asideWalk: { flex: 1 },
    asideWarning: { ...type.footnoteBold },
  });
}
