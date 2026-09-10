import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          backgroundColor: colors.chipBg,
          borderRadius: radii.md,
          padding: 3,
        },
        segment: {
          flex: 1,
          paddingVertical: spacing.sm,
          borderRadius: radii.sm,
          alignItems: 'center',
        },
        segmentActive: { backgroundColor: colors.surface },
        text: { ...type.footnoteMedium, color: colors.textSecondary },
        textActive: { color: colors.textPrimary },
      }),
    [colors],
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
