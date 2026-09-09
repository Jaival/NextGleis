import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DelayBadge } from './DelayBadge';
import { formatTime } from '../lib/time';
import { radii, spacing, type } from '../lib/theme';
import { useThemeColors } from '../lib/useThemeColors';
import type { DepartureRow } from '../types';

export function DepartureListItem({ row }: { row: DepartureRow }) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        },
        lineBadge: {
          backgroundColor: colors.primarySoft,
          borderRadius: radii.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          minWidth: 64,
          alignItems: 'center',
        },
        lineText: { ...type.footnoteBold, color: colors.primary },
        middle: { flex: 1 },
        direction: { ...type.subheadMedium, color: colors.textPrimary },
        platform: { ...type.caption, color: colors.textSecondary, marginTop: 2 },
        right: { alignItems: 'flex-end', gap: spacing.xs },
        time: { ...type.subheadBold, color: colors.textPrimary },
        timeCancelled: { textDecorationLine: 'line-through', color: colors.textSecondary },
      }),
    [colors],
  );

  const statusLabel = row.cancelled
    ? 'cancelled'
    : row.delayMinutes && row.delayMinutes > 0
      ? `delayed ${row.delayMinutes} minutes`
      : 'on time';

  const a11yLabel = [
    row.line || 'Unlabelled line',
    `to ${row.direction || 'unknown direction'}`,
    `departs ${formatTime(row.scheduledTime)}`,
    statusLabel,
    row.platform ? `platform ${row.platform}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.row} accessible accessibilityLabel={a11yLabel}>
      <View style={styles.lineBadge}>
        <Text style={styles.lineText} numberOfLines={1}>
          {row.line || '—'}
        </Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.direction} numberOfLines={1}>
          {row.direction || 'Unknown direction'}
        </Text>
        {row.platform ? <Text style={styles.platform}>Platform {row.platform}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, row.cancelled && styles.timeCancelled]}>
          {formatTime(row.scheduledTime)}
        </Text>
        <DelayBadge row={row} />
      </View>
    </View>
  );
}
