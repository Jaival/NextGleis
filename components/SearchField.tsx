import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, css, useReducedMotion } from 'react-native-reanimated';
import { duration as durations, curve, easing } from '@/lib/motion';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
};

const focusRing = css.create({
  base: {
    transitionProperty: ['borderColor', 'backgroundColor'],
    transitionDuration: durations.fast,
    transitionTimingFunction: curve.out,
  },
});

const CLEAR_IN = FadeIn.duration(durations.fast).easing(easing.out);
const CLEAR_OUT = FadeOut.duration(durations.press).easing(easing.out);

export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();

  return (
    <Animated.View
      style={[styles.field, focused && styles.fieldFocused, !reduced && focusRing.base]}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused ? colors.primary : colors.textTertiary}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel}
        returnKeyType="search"
        selectionColor={colors.primary}
      />
      {/* Fixed-width slot: the button fades in and out without ever resizing
          the input, which would otherwise nudge the caret on the first keystroke. */}
      <View style={styles.clearSlot}>
        {value.length > 0 ? (
          <Animated.View entering={CLEAR_IN} exiting={CLEAR_OUT}>
            <Pressable
              onPress={() => onChangeText('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
            >
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      // Resting state is a recessed well; focus lifts it onto `surface` and
      // draws the ring. The unfocused border matches the fill so the field
      // doesn't change size when the ring appears.
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      height: 46,
    },
    fieldFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      ...type.input,
      color: colors.textPrimary,
      // Android's TextInput ships vertical padding that breaks the row's centring.
      paddingVertical: 0,
    },
    clearSlot: { width: 22, alignItems: 'flex-end' },
  });
}
