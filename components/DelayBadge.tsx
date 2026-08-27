import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';
import type { DepartureRow } from '../types';

type BadgeSpec = { label: string; bg: string; fg: string };

function badgeSpecFor(row: DepartureRow): BadgeSpec {
  if (row.cancelled) return { label: 'Cancelled', bg: colors.cancelledSoft, fg: colors.cancelled };
  if (row.delayMinutes && row.delayMinutes > 0) {
    return { label: `+${row.delayMinutes} min`, bg: colors.delaySoft, fg: colors.delay };
  }
  return { label: 'On time', bg: colors.onTimeSoft, fg: colors.onTime };
}

export function DelayBadge({ row }: { row: DepartureRow }) {
  const spec = badgeSpecFor(row);
  return (
    <View
      style={[styles.badge, { backgroundColor: spec.bg }]}
      accessible
      accessibilityLabel={spec.label}
    >
      <Text style={[styles.text, { color: spec.fg }]}>{spec.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-end',
  },
  text: { fontSize: 12, fontWeight: '700' },
});
