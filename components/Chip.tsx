import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { tap } from '@/lib/haptics';
import { PRESS_SCALE, curve, duration } from '@/lib/motion';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

type ChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  // A secondary action on long-press, offered to screen readers as a named
  // action (they can't discover a long-press otherwise).
  onLongPress?: () => void;
  longPressLabel?: string;
  // Some but not all of what the chip stands for is filtered out.
  partial?: boolean;
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

export function Chip({
  label,
  active,
  onPress,
  accessibilityLabel,
  onLongPress,
  longPressLabel,
  partial = false,
}: ChipProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  return (
    <Pressable
      onPress={() => {
        tap.selection();
        onPress();
      }}
      onLongPress={
        onLongPress
          ? () => {
              tap.light();
              onLongPress();
            }
          : undefined
      }
      // `activate` is listed too: once custom actions are declared, a plain
      // double-tap is routed here rather than to onPress.
      accessibilityActions={
        onLongPress && longPressLabel
          ? [{ name: 'activate' }, { name: 'longpress', label: longPressLabel }]
          : undefined
      }
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') onPress();
        if (event.nativeEvent.actionName === 'longpress') onLongPress?.();
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
        {partial ? (
          <Ionicons
            name="funnel"
            size={10}
            color={active ? colors.accentForeground : colors.mutedForeground}
            style={styles.partial}
          />
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: spacing.md,
      // minHeight so large system text grows the chip instead of clipping it.
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.pill,
      marginRight: spacing.sm,
      borderWidth: 1,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.primary },
    chipInactive: { backgroundColor: colors.muted, borderColor: colors.border },
    text: { ...type.footnoteMedium, color: colors.mutedForeground },
    textActive: { color: colors.accentForeground },
    partial: { marginLeft: spacing.xs },
  });
}
