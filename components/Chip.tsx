import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radii, spacing, type } from '../lib/theme';
import { useThemeColors } from '../lib/useThemeColors';

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function Chip({ label, active, onPress, accessibilityLabel }: ChipProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
          marginRight: spacing.xs,
        },
        chipActive: { backgroundColor: colors.chipBgActive },
        chipInactive: { backgroundColor: colors.chipBg },
        text: { ...type.footnoteMedium, color: colors.chipText },
        textActive: { ...type.footnoteMedium, color: colors.chipTextActive },
      }),
    [colors],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={active ? styles.textActive : styles.text}>{label}</Text>
    </Pressable>
  );
}
