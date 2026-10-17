import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, css, useReducedMotion } from 'react-native-reanimated';
import { duration as durations, curve, easing } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  autoFocus?: boolean;
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

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  autoFocus,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();

  return (
    <Animated.View
      style={[styles.field, focused && styles.fieldFocused, !reduced && focusRing.base]}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused ? colors.primary : colors.mutedForeground}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel}
        autoFocus={autoFocus}
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
              accessibilityLabel={t('search.clear')}
              hitSlop={12}
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      // Resting state is a recessed well; focus lifts it onto `surface` and
      // draws the ring. The unfocused border matches the fill so the field
      // doesn't change size when the ring appears.
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.muted,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      height: 46,
    },
    fieldFocused: { borderColor: colors.primary, backgroundColor: colors.card },
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      ...type.input,
      color: colors.foreground,
      // Android's TextInput ships vertical padding that breaks the row's centring.
      paddingVertical: 0,
    },
    clearSlot: { width: 22, alignItems: 'flex-end' },
  });
}
