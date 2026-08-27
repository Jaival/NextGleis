import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function Chip({ label, active, onPress, accessibilityLabel }: ChipProps) {
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

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.chipBgActive },
  chipInactive: { backgroundColor: colors.chipBg },
  text: { color: colors.chipText, fontWeight: '600', fontSize: 13 },
  textActive: { color: colors.chipTextActive, fontWeight: '600', fontSize: 13 },
});
