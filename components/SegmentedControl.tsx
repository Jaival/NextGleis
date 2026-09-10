import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { tap } from '@/lib/haptics';
import { duration, easing } from '@/lib/motion';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

const PAD = 3;

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

type Rect = { x: number; width: number };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reduced = useReducedMotion();

  // Measured once per segment with onLayout, never per frame.
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    const rect = rects[value];
    if (!rect) return;
    // The first placement is a measurement result, not a state change — sliding
    // in from x=0 on mount would animate something the user never changed.
    if (!placed.current || reduced) {
      placed.current = true;
      x.set(rect.x);
      width.set(rect.width);
      opacity.set(1);
      return;
    }
    const config = { duration: duration.base, easing: easing.inOut };
    x.set(withTiming(rect.x, config));
    width.set(withTiming(rect.width, config));
  }, [value, rects, reduced, x, width, opacity]);

  // The sanctioned width animation: the thumb is absolutely positioned with no
  // children, so nothing re-lays-out, and its corner radius survives — scaleX
  // would smear the pill into an oval.
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    width: width.get(),
    opacity: opacity.get(),
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.thumb, thumbStyle]} />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (active) return;
              tap.selection();
              onChange(option.value);
            }}
            onLayout={({ nativeEvent: { layout } }) =>
              setRects((prev) =>
                prev[option.value]?.x === layout.x && prev[option.value]?.width === layout.width
                  ? prev
                  : { ...prev, [option.value]: { x: layout.x, width: layout.width } },
              )
            }
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={styles.segment}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      borderCurve: 'continuous',
      padding: PAD,
    },
    thumb: {
      position: 'absolute',
      // The thumb sits over the segments; taps must fall through to them.
      pointerEvents: 'none',
      top: PAD,
      bottom: PAD,
      left: 0,
      borderRadius: radii.sm,
      borderCurve: 'continuous',
      backgroundColor: colors.surface,
      boxShadow: colors.shadowCard,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { ...type.footnoteMedium, color: colors.textSecondary },
    textActive: { color: colors.textPrimary },
  });
}
