import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DisruptionBanner } from '@/components/DisruptionBanner';
import { EmptyState } from '@/components/EmptyState';
import { LineBadge } from '@/components/LineBadge';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ServicePill } from '@/components/ServicePill';
import { getTrip } from '@/lib/api';
import { useT, type Translate } from '@/lib/i18n';
import { radii, spacing, type } from '@/lib/theme';
import { addMinutes, berlinNow, formatTime } from '@/lib/time';
import { useThemeColors } from '@/lib/useThemeColors';
import type { TripStop } from '@/types';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Styles = ReturnType<typeof createStyles>;

// Rows are a fixed height so the list can jump straight to the rider's own
// stop without measuring everything above it first.
const ROW_HEIGHT = 64;

// The time a stop is shown with: when the service leaves it, or for the last
// stop when it arrives.
function stopTime(stop: TripStop): { scheduled?: string; delay?: number } {
  return stop.departure
    ? { scheduled: stop.departure, delay: stop.departureDelayMinutes }
    : { scheduled: stop.arrival, delay: stop.arrivalDelayMinutes };
}

function stopLabel(stop: TripStop, passed: boolean, t: Translate): string {
  const { scheduled, delay } = stopTime(stop);
  return [
    stop.name,
    scheduled
      ? stop.departure
        ? t('departure.departs', formatTime(scheduled))
        : t('departure.arrives', formatTime(scheduled))
      : null,
    stop.cancelled ? t('trip.stopCancelled') : delay ? t('departure.delayedBy', delay) : null,
    stop.platform ? t('departure.platform', stop.platform) : null,
    passed ? t('trip.departed') : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export default function TripScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const t = useT();
  const router = useRouter();
  const { id, line, at, side } = useLocalSearchParams<{
    id: string;
    line?: string;
    at?: string;
    side?: 'departures' | 'arrivals';
  }>();

  const { data, isLoading, isError, isRefetching, refetch, fetchStatus } = useQuery({
    queryKey: ['trip', id],
    queryFn: ({ signal }) => getTrip(id, signal),
    refetchInterval: 30_000,
  });
  const isOffline = fetchStatus === 'paused';
  const stops = useMemo(() => data?.stops ?? [], [data]);

  // The stop the rider came from: the one whose time on this trip is the
  // time on the board row they tapped.
  const ownIndex = useMemo(
    () =>
      at
        ? stops.findIndex((stop) => (side === 'arrivals' ? stop.arrival : stop.departure) === at)
        : -1,
    [stops, at, side],
  );

  // A stop is behind the service once its (realtime) departure has passed.
  // Recomputed on each render (every refetch at least), so it keeps up with
  // the clock while the screen is open.
  const now = berlinNow();
  let passedUntil = -1;
  stops.forEach((stop, index) => {
    const { scheduled, delay } = stopTime(stop);
    if (scheduled && addMinutes(scheduled, delay ?? 0) < now) passedUntil = index;
  });

  // Open on the rider's own stop rather than the first stop of a long run
  // (an ICE can have twenty before it). Once, not on every refetch.
  const list = useRef<FlatList<TripStop>>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || ownIndex < 1) return;
    scrolled.current = true;
    list.current?.scrollToIndex({ index: ownIndex - 1, animated: false });
  }, [ownIndex]);

  const title = data?.line || line || t('trip.fallbackTitle');
  const warnings = useMemo(
    () => data?.notices?.filter((notice) => notice.severity === 'warning') ?? [],
    [data],
  );

  return (
    <ScreenContainer edges={[]}>
      <Stack.Screen options={{ title }} />

      {isLoading ? (
        isOffline ? (
          <EmptyState
            fill
            icon="cloud-offline-outline"
            title={t('common.offline')}
            message={t('trip.offlineLoading')}
          />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )
      ) : (
        <FlatList
          ref={list}
          data={stops}
          keyExtractor={(stop, index) => `${stop.stopId ?? stop.name}-${index}`}
          getItemLayout={(_data, index) => ({
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * index,
            index,
          })}
          // The header's height isn't known up front, so a jump can land a
          // little off; better that than none.
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={
            data ? (
              <View>
                <View style={styles.summary}>
                  <LineBadge line={data.line} />
                  <View style={styles.summaryText}>
                    <Text style={styles.direction} numberOfLines={2}>
                      {t('trip.to', data.direction)}
                    </Text>
                    <View style={styles.summaryMeta}>
                      <ServicePill kind={data.kind} />
                      {data.operator ? (
                        <Text style={styles.operator} numberOfLines={1}>
                          {data.operator}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
                {data.cancelled ? (
                  <Text style={styles.cancelled}>{t('trip.cancelled')}</Text>
                ) : null}
                <DisruptionBanner notices={warnings} />
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <StopRow
              stop={item}
              first={index === 0}
              last={index === stops.length - 1}
              own={index === ownIndex}
              passed={index <= passedUntil}
              onOpen={
                item.stopId
                  ? () =>
                      router.push({
                        pathname: '/board/[evaNo]',
                        params: { evaNo: item.stopId!, name: item.name },
                      })
                  : undefined
              }
              styles={styles}
              colors={colors}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg, flexGrow: 1 }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            isOffline ? (
              <EmptyState
                fill
                icon="cloud-offline-outline"
                title={t('common.offline')}
                message={t('trip.offlineLoading')}
              />
            ) : isError ? (
              <EmptyState
                fill
                icon="alert-circle-outline"
                title={t('trip.error')}
                message={t('common.pullToRetry')}
              />
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
}

function StopRow({
  stop,
  first,
  last,
  own,
  passed,
  onOpen,
  styles,
  colors,
}: {
  stop: TripStop;
  first: boolean;
  last: boolean;
  own: boolean;
  passed: boolean;
  onOpen?: () => void;
  styles: Styles;
  colors: Colors;
}) {
  const t = useT();
  const { scheduled, delay } = stopTime(stop);
  const delayed = !stop.cancelled && Boolean(delay);
  const platformChanged = Boolean(stop.platform && stop.plannedPlatform);
  const dotColor = own ? colors.primary : passed ? colors.borderStrong : colors.textTertiary;

  return (
    <Pressable
      onPress={onOpen}
      disabled={!onOpen}
      accessibilityRole={onOpen ? 'button' : undefined}
      accessibilityLabel={stopLabel(stop, passed, t)}
      accessibilityHint={onOpen ? t('trip.openBoard', stop.name) : undefined}
      style={({ pressed }) => [
        styles.row,
        own && styles.rowOwn,
        pressed && styles.rowPressed,
        passed && !own && styles.rowPassed,
      ]}
    >
      <View style={styles.times}>
        {scheduled ? (
          <Text style={[styles.time, stop.cancelled && styles.struck]}>
            {formatTime(scheduled)}
          </Text>
        ) : null}
        {delayed && scheduled ? (
          <Text style={styles.realtime}>{formatTime(addMinutes(scheduled, delay!))}</Text>
        ) : null}
      </View>

      {/* The line through the dots is the trip itself: it starts at the
          first stop and ends at the last. */}
      <View style={styles.rail}>
        <View style={[styles.railLine, first && styles.railStart, last && styles.railEnd]} />
        <View style={[styles.dot, own && styles.dotOwn, { borderColor: dotColor }]} />
      </View>

      <View style={styles.stopText}>
        <Text
          style={[styles.stopName, own && styles.stopNameOwn, stop.cancelled && styles.struck]}
          numberOfLines={1}
        >
          {stop.name}
        </Text>
        {stop.cancelled ? (
          <Text style={styles.stopCancelled}>{t('trip.stopCancelled')}</Text>
        ) : stop.platform ? (
          <View style={styles.platformLine}>
            <Text style={[styles.platform, platformChanged && styles.platformChanged]}>
              {t('departure.platform', stop.platform)}
            </Text>
            {platformChanged ? (
              <Text style={styles.plannedPlatform}>{stop.plannedPlatform}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    summaryText: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
    direction: { ...type.headline, color: colors.textPrimary },
    summaryMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    operator: { ...type.caption, color: colors.textSecondary, flexShrink: 1 },
    cancelled: {
      ...type.footnoteMedium,
      color: colors.cancelled,
      backgroundColor: colors.cancelledSoft,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.sm,
      overflow: 'hidden',
    },
    row: {
      height: ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    rowOwn: { backgroundColor: colors.primarySoft },
    rowPressed: { backgroundColor: colors.surfaceMuted },
    rowPassed: { opacity: 0.55 },
    times: { width: 48, alignItems: 'flex-end' },
    time: { ...type.timeSmall, color: colors.textPrimary },
    realtime: { ...type.timeSmall, color: colors.delay },
    struck: { textDecorationLine: 'line-through', color: colors.textTertiary },
    rail: { width: 14, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
    railLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: colors.border,
    },
    railStart: { top: '50%' },
    railEnd: { bottom: '50%' },
    dot: {
      width: 12,
      height: 12,
      borderRadius: radii.pill,
      borderWidth: 2,
      backgroundColor: colors.background,
    },
    dotOwn: { width: 14, height: 14, backgroundColor: colors.primary },
    stopText: { flex: 1, gap: 2 },
    stopName: { ...type.subheadMedium, color: colors.textPrimary },
    stopNameOwn: { ...type.subheadBold },
    stopCancelled: { ...type.captionBold, color: colors.cancelled },
    platformLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    platform: { ...type.micro, color: colors.textSecondary },
    platformChanged: { ...type.microBold, color: colors.delay },
    plannedPlatform: {
      ...type.micro,
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
  });
}
