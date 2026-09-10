import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { delayBadgeSpec } from '@/lib/delay';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { DepartureRow } from '@/types';

export function DelayBadge({ row }: { row: DepartureRow }) {
  const { colors } = useThemeColors();
  const spec = delayBadgeSpec(row, colors);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.sm,
          alignSelf: 'flex-end',
        },
        text: { ...type.captionBold },
      }),
    [],
  );

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
