import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { tap } from '@/lib/haptics';
import { PRESS_SCALE, curve, duration } from '@/lib/motion';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

// Fill and label crossfade together — half the duration with the label already
// switched would put white text on the unselected fill, which is unreadable.
const motion = css.create({
  surface: {
    transform: [{ scale: 1 }],
    transitionProperty: ['transform', 'backgroundColor'],
    transitionDuration: [duration.press, duration.fast],
    transitionTimingFunction: curve.out,
  },
  down: { transform: [{ scale: PRESS_SCALE }] },
  label: {
    transitionProperty: 'color',
    transitionDuration: duration.fast,
    transitionTimingFunction: curve.out,
  },
});

export function Chip({ label, active, onPress, accessibilityLabel }: ChipProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  return (
    <Pressable
      onPress={() => {
        tap.selection();
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      // The pill is under the 44pt minimum on its short axis by design.
      hitSlop={{ top: 10, bottom: 10 }}
      pressRetentionOffset={16}
    >
      <Animated.View
        style={[
          styles.chip,
          active ? styles.chipActive : styles.chipInactive,
          !reduced && motion.surface,
          pressed && !reduced && motion.down,
        ]}
      >
        <Animated.Text style={[styles.text, active && styles.textActive, !reduced && motion.label]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.md,
      height: 32,
      justifyContent: 'center',
      borderRadius: radii.pill,
      marginRight: spacing.sm,
      borderWidth: 1,
    },
    chipActive: { backgroundColor: colors.chipBgActive, borderColor: colors.primary },
    chipInactive: { backgroundColor: colors.chipBg, borderColor: colors.border },
    text: { ...type.footnoteMedium, color: colors.chipText },
    textActive: { color: colors.chipTextActive },
  });
}
