import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, css, useReducedMotion } from 'react-native-reanimated';
import { mix } from '@/lib/contrast';
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
  // 'header' is for a field that sits on the screen's header band.
  tone?: 'default' | 'header';
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
  tone = 'default',
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const t = useT();
  const styles = useMemo(() => createStyles(theme, tone), [theme, tone]);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();
  // On the header band the field's own colours would clash: text and icons
  // follow the band's foreground instead.
  const onHeader = tone === 'header';
  const iconColor = onHeader ? colors.headerForeground : colors.mutedForeground;

  return (
    <Animated.View
      style={[styles.field, focused && styles.fieldFocused, !reduced && focusRing.base]}
    >
      <Ionicons
        name="search"
        size={18}
        color={focused && !onHeader ? colors.primary : iconColor}
        style={styles.icon}
      />
      <TextInput
        // Android keeps the typeface a TextInput had, so after a skin switch back
        // to the system font the typed text stayed in Plex Mono. A new key per
        // family mounts a fresh input.
        key={theme.type.input.fontFamily ?? 'system'}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={
          onHeader ? mix(colors.header, colors.headerForeground, 0.7) : colors.mutedForeground
        }
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel={accessibilityLabel}
        autoFocus={autoFocus}
        returnKeyType="search"
        selectionColor={onHeader ? colors.headerForeground : colors.primary}
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
              <Ionicons name="close-circle" size={18} color={iconColor} />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles({ colors, type, radii }: Theme, tone: 'default' | 'header') {
  const onHeader = tone === 'header';
  // A lighter or darker wash of the band, so the field reads as part of it.
  const headerFill = mix(colors.header, colors.headerForeground, 0.14);
  return StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      // Resting state is a recessed well; focus lifts it onto `surface` and
      // draws the ring. The unfocused border matches the fill so the field
      // doesn't change size when the ring appears.
      backgroundColor: onHeader ? headerFill : colors.muted,
      borderWidth: 1,
      borderColor: onHeader ? headerFill : colors.muted,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      // minHeight, not height: a large system font grows the text past 46pt.
      minHeight: 46,
    },
    // On the header the fill stays, so the foreground text never lands on a
    // card-coloured field.
    fieldFocused: onHeader
      ? { borderColor: colors.headerForeground }
      : { borderColor: colors.primary, backgroundColor: colors.card },
    icon: { marginRight: spacing.sm },
    input: {
      flex: 1,
      ...type.input,
      color: onHeader ? colors.headerForeground : colors.foreground,
      // Android's TextInput ships vertical padding that breaks the row's centring.
      paddingVertical: 0,
    },
    clearSlot: { width: 22, alignItems: 'flex-end' },
  });
}
