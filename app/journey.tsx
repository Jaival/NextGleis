import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { LineBadge } from '@/components/LineBadge';
import { NoticeLine } from '@/components/NoticeLine';
import { PressableScale } from '@/components/PressableScale';
import { ServicePill, serviceDescription } from '@/components/ServicePill';
import { departureStatus } from '@/lib/delay';
import { useLanguage, useT, type Translate } from '@/lib/i18n';
import { journeySteps, type Transfer } from '@/lib/journeySteps';
import { spacing, type Theme, type ThemeColors } from '@/lib/theme';
import { addMinutes, formatDay, formatDuration, formatTime, minutesBetween } from '@/lib/time';
import { useJourneys, type JourneySearch } from '@/lib/useJourneys';
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

          {steps.map((step, index) =>
            step.type === 'ride' ? (
              <Ride
                key={index}
                leg={step.leg}
                onOpen={step.leg.tripId ? () => openTrip(step.leg) : undefined}
                styles={styles}
                colors={colors}
                t={t}
              />
            ) : step.type === 'transfer' ? (
              <Change key={index} transfer={step.transfer} styles={styles} colors={colors} t={t} />
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
            ),
          )}
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

function Ride({
  leg,
  onOpen,
  styles,
  colors,
  t,
}: {
  leg: JourneyLeg;
  onOpen?: () => void;
  styles: Styles;
  colors: Colors;
  t: Translate;
}) {
  const label = [
    [leg.line, leg.kind ? serviceDescription(leg.kind, t) : null].filter(Boolean).join(', '),
    leg.direction ? t('departure.to', leg.direction) : null,
    leg.cancelled ? t('status.cancelled') : null,
    `${leg.origin}, ${t('departure.departs', formatTime(leg.departure))}`,
    leg.departureDelayMinutes ? t('departure.delayedBy', leg.departureDelayMinutes) : null,
    leg.departurePlatform ? t('departure.platform', leg.departurePlatform) : null,
    `${leg.destination}, ${t('departure.arrives', formatTime(leg.arrival))}`,
    leg.arrivalDelayMinutes ? t('departure.delayedBy', leg.arrivalDelayMinutes) : null,
    leg.arrivalPlatform ? t('departure.platform', leg.arrivalPlatform) : null,
  ]
    .filter(Boolean)
    .join('. ');

  const body = (
    <>
      <Stop
        end="start"
        time={leg.departure}
        delay={leg.departureDelayMinutes}
        name={leg.origin}
        platform={leg.departurePlatform}
        plannedPlatform={leg.plannedDeparturePlatform}
        cancelled={leg.cancelled}
        styles={styles}
        t={t}
      />

      <View style={styles.row}>
        <View style={styles.times} />
        <View style={styles.rail}>
          <View style={styles.railLine} />
        </View>
        <View style={styles.service}>
          <View style={styles.serviceHeader}>
            <LineBadge compact line={leg.line ?? ''} />
            {leg.kind ? <ServicePill kind={leg.kind} /> : null}
            <Text style={styles.serviceDuration}>
              {formatDuration(minutesBetween(leg.departure, leg.arrival), t)}
            </Text>
            {onOpen ? (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.mutedForeground}
                style={styles.serviceChevron}
              />
            ) : null}
          </View>
          {leg.direction ? (
            <Text style={styles.serviceDirection} numberOfLines={2}>
              {t('departure.to', leg.direction)}
            </Text>
          ) : null}
          {leg.cancelled ? (
            <Text style={styles.serviceCancelled}>{t('status.cancelled')}</Text>
          ) : null}
          {leg.notices?.map((notice) => (
            <NoticeLine key={notice.text} notice={notice} lines={4} />
          ))}
        </View>
      </View>

      <Stop
        end="end"
        time={leg.arrival}
        delay={leg.arrivalDelayMinutes}
        name={leg.destination}
        platform={leg.arrivalPlatform}
        plannedPlatform={leg.plannedArrivalPlatform}
        cancelled={leg.cancelled}
        styles={styles}
        t={t}
      />
    </>
  );

  return onOpen ? (
    <PressableScale
      onPress={onOpen}
      style={styles.ride}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t('trip.openHint')}
    >
      {body}
    </PressableScale>
  ) : (
    <View style={styles.ride} accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

// Where a ride starts or ends: the time, the stop, and the platform — the
// three things read off this screen while standing in a station.
function Stop({
  end,
  time,
  delay,
  name,
  platform,
  plannedPlatform,
  cancelled,
  styles,
  t,
}: {
  end: 'start' | 'end';
  time: string;
  delay?: number;
  name: string;
  platform?: string;
  plannedPlatform?: string;
  cancelled: boolean;
  styles: Styles;
  t: Translate;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.times}>
        <Text style={[styles.time, cancelled && styles.struck]}>{formatTime(time)}</Text>
        {delay && !cancelled ? (
          <Text style={styles.realtime}>{formatTime(addMinutes(time, delay))}</Text>
        ) : null}
      </View>
      <View style={styles.rail}>
        <View style={[styles.railLine, end === 'start' ? styles.railStart : styles.railEnd]} />
        <View style={styles.dot} />
      </View>
      <Text style={[styles.stopName, cancelled && styles.struck]} numberOfLines={2}>
        {name}
      </Text>
      {platform ? (
        <View style={[styles.platform, plannedPlatform && styles.platformChanged]}>
          {plannedPlatform ? <Text style={styles.platformPlanned}>{plannedPlatform}</Text> : null}
          <Text style={[styles.platformText, plannedPlatform && styles.platformTextChanged]}>
            {t('departure.platform', platform)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Change({
  transfer,
  styles,
  colors,
  t,
}: {
  transfer: Transfer;
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

    ride: {
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    // The three rows of a ride stack without a gap, so the rail through them
    // is one unbroken line from boarding to getting off.
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
    times: { width: 44, alignItems: 'flex-end' },
    time: { ...type.timeSmall, fontSize: 15, color: colors.foreground },
    realtime: { ...type.timeSmall, color: colors.delay },
    struck: { textDecorationLine: 'line-through', color: colors.mutedForeground },
    rail: { width: 14, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
    railLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: radii.pill,
      backgroundColor: colors.primary,
    },
    railStart: { top: '50%' },
    railEnd: { bottom: '50%' },
    dot: {
      width: 14,
      height: 14,
      borderRadius: radii.pill,
      borderWidth: 3,
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    stopName: { flex: 1, ...type.subheadBold, color: colors.foreground },
    platform: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.sm,
      backgroundColor: colors.muted,
    },
    platformChanged: { backgroundColor: colors.delaySoft },
    platformText: { ...type.footnoteBold, color: colors.foreground },
    platformTextChanged: { color: colors.delay },
    platformPlanned: {
      ...type.caption,
      color: colors.mutedForeground,
      textDecorationLine: 'line-through',
    },
    service: { flex: 1, gap: spacing.xs, paddingVertical: spacing.sm },
    serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    serviceDuration: { ...type.caption, color: colors.mutedForeground },
    serviceChevron: { marginLeft: 'auto' },
    serviceDirection: { ...type.footnote, color: colors.mutedForeground },
    serviceCancelled: { ...type.captionBold, color: colors.cancelled },

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
    asideTight: { backgroundColor: colors.delaySoft },
    asideMissed: { backgroundColor: colors.cancelledSoft },
    asideBody: { flex: 1, gap: 2 },
    asideTitle: { ...type.footnoteBold, color: colors.foreground },
    asideText: { ...type.footnote, color: colors.mutedForeground },
    asideWalk: { flex: 1 },
    asideWarning: { ...type.footnoteBold },
  });
}
