import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Countdown, countdownLabel } from './Countdown';
import { LineBadge } from './LineBadge';
import { NoticeLine } from './NoticeLine';
import { PlatformTile } from './PlatformTile';
import { ServicePill, serviceDescription } from './ServicePill';
import { departureStatus } from '@/lib/delay';
import { useT } from '@/lib/i18n';
import { formatTime } from '@/lib/time';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { DepartureRow } from '@/types';

// A board is scanned, not read. The three columns are ordered by what the eye
// goes for first: which service it is, where it goes, when it leaves — and the
// colour in a row is the line badge (which product), the DB pill (whose train)
// and the status caption (whether to worry).
// `onPress` takes the row rather than being bound per row, so the board can
// pass one stable callback and memo still skips unchanged rows.
function DepartureListItemBase({
  row,
  now,
  onPress,
}: {
  row: DepartureRow;
  // The screen's clock; see useNow.
  now: string;
  onPress?: (row: DepartureRow) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();

  const status = departureStatus(row, colors, t);
  // Disruption warnings are shown once in the board's banner; a row only
  // carries what's specific to this one service.
  const notices = row.notices?.filter((notice) => notice.severity === 'info') ?? [];
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
    status.kind === 'cancelled'
      ? null
      : countdownLabel(row.scheduledTime, row.delayMinutes, now, t),
    ...notices.map((notice) => notice.text),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress ? () => onPress(row) : undefined}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        status.kind === 'cancelled' && styles.rowCancelled,
      ]}
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={a11yLabel}
      accessibilityHint={onPress ? t('trip.openHint') : undefined}
    >
      <PlatformTile platform={row.platform} plannedPlatform={row.plannedPlatform} kind={row.kind} />

      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <LineBadge compact line={row.line} />
          <Text style={styles.direction} numberOfLines={2}>
            {row.direction || t('departure.unknownDirection')}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text
            style={[
              styles.time,
              status.kind === 'delayed' && { color: status.fg },
              status.kind === 'cancelled' && styles.timeCancelled,
            ]}
          >
            {headlineTime}
          </Text>
          {status.kind === 'delayed' ? (
            <Text style={styles.scheduledStruck}>{scheduled}</Text>
          ) : null}
          <Text style={[styles.statusLabel, { color: status.fg }]}>{status.label}</Text>
          <ServicePill kind={row.kind} />
        </View>
        {notices.map((notice) => (
          <NoticeLine key={notice.text} notice={notice} />
        ))}
      </View>

      <Countdown
        time={row.scheduledTime}
        delayMinutes={row.delayMinutes}
        now={now}
        cancelled={status.kind === 'cancelled'}
      />
    </Pressable>
  );
}

// Boards refetch every 30s and a busy station returns well over a hundred rows;
// without this every poll re-renders all of them even when nothing changed.
export const DepartureListItem = memo(DepartureListItemBase);

function createStyles({ colors, type }: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    rowPressed: { backgroundColor: colors.muted },
    rowCancelled: { opacity: 0.7 },
    middle: { flex: 1, minWidth: 0, gap: spacing.xs },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    direction: { ...type.subheadMedium, color: colors.foreground, flexShrink: 1 },
    meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
    time: { ...type.timeSmall, color: colors.foreground },
    timeCancelled: { textDecorationLine: 'line-through', color: colors.mutedForeground },
    scheduledStruck: {
      ...type.timeSmall,
      color: colors.mutedForeground,
      textDecorationLine: 'line-through',
    },
    statusLabel: { ...type.captionBold },
  });
}
