import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineBadge } from './LineBadge';
import { NoticeLine } from './NoticeLine';
import { ServicePill, serviceDescription } from './ServicePill';
import { departureStatus } from '@/lib/delay';
import { useT } from '@/lib/i18n';
import { formatTime } from '@/lib/time';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { DepartureRow } from '@/types';

// A board is scanned, not read. The three columns are ordered by what the eye
// goes for first: which service it is, where it goes, when it leaves — and the
// colour in a row is the line badge (which product), the DB pill (whose train)
// and the status caption (whether to worry).
function DepartureListItemBase({ row }: { row: DepartureRow }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();

  const status = departureStatus(row, colors, t);
  // Disruption warnings are shown once in the board's banner; a row only
  // carries what's specific to this one service.
  const notices = row.notices?.filter((notice) => notice.severity === 'info') ?? [];
  const platformChanged = Boolean(row.platform && row.plannedPlatform);
  const scheduled = formatTime(row.scheduledTime);
  // A delayed departure's headline time is when it will *actually* leave; the
  // scheduled one drops to a struck-through footnote beside the delta.
  const headlineTime =
    status.kind === 'delayed' && row.actualTime ? formatTime(row.actualTime) : scheduled;

  const a11yLabel = [
    row.line || t('departure.unlabelledLine'),
    serviceDescription(row.kind, t),
    t('departure.to', row.direction || t('departure.unknownDirection')),
    t('departure.departs', scheduled),
    status.kind === 'delayed' ? t('departure.delayedBy', row.delayMinutes ?? 0) : status.label,
    row.platform && row.plannedPlatform
      ? t('departure.platformChanged', row.platform, row.plannedPlatform)
      : row.platform
        ? t('departure.platform', row.platform)
        : null,
    ...notices.map((notice) => notice.text),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[styles.row, status.kind === 'cancelled' && styles.rowCancelled]}
      accessible
      accessibilityLabel={a11yLabel}
    >
      <LineBadge line={row.line} />

      <View style={styles.middle}>
        <Text style={styles.direction} numberOfLines={1}>
          {row.direction || t('departure.unknownDirection')}
        </Text>
        <View style={styles.meta}>
          <ServicePill kind={row.kind} />
          {row.platform ? (
            <View style={[styles.platform, platformChanged && styles.platformChanged]}>
              <Text style={[styles.platformText, platformChanged && styles.platformTextChanged]}>
                {t('departure.platform', row.platform)}
              </Text>
            </View>
          ) : null}
          {/* The old platform stays visible, struck through, so a rider who
              memorised it notices the move instead of reading past it. */}
          {platformChanged && row.plannedPlatform ? (
            <Text style={styles.plannedPlatform}>{row.plannedPlatform}</Text>
          ) : null}
        </View>
        {notices.map((notice) => (
          <NoticeLine key={notice.text} notice={notice} />
        ))}
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.time,
            status.kind === 'delayed' && { color: status.fg },
            status.kind === 'cancelled' && styles.timeCancelled,
          ]}
        >
          {headlineTime}
        </Text>
        <View style={styles.statusLine}>
          {status.kind === 'delayed' ? (
            <Text style={styles.scheduledStruck}>{scheduled}</Text>
          ) : null}
          <Text style={[styles.statusLabel, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>
    </View>
  );
}

// Boards refetch every 30s and a busy station returns well over a hundred rows;
// without this every poll re-renders all of them even when nothing changed.
export const DepartureListItem = memo(DepartureListItemBase);

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowCancelled: { opacity: 0.7 },
    middle: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
    direction: { ...type.subheadMedium, color: colors.textPrimary },
    meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    platform: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.sm,
      borderCurve: 'continuous',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    platformText: { ...type.micro, color: colors.textSecondary },
    platformChanged: { backgroundColor: colors.delaySoft },
    platformTextChanged: { ...type.microBold, color: colors.delay },
    plannedPlatform: {
      ...type.micro,
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    right: { alignItems: 'flex-end', gap: 2 },
    time: { ...type.time, color: colors.textPrimary },
    timeCancelled: { textDecorationLine: 'line-through', color: colors.textSecondary },
    statusLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    scheduledStruck: {
      ...type.timeSmall,
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    statusLabel: { ...type.captionBold },
  });
}
