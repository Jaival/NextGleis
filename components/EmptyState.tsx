import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { duration, easing } from '@/lib/motion';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title?: string;
  message: string;
  /** Fills the available space and centres vertically. */
  fill?: boolean;
};

// Empty states resolve *after* a wait — an unloaded board, a search that found
// nothing — so they arrive where content was expected. A short fade keeps that
// from reading as a flash of failure. Reduced motion is handled by the
// builder's default (`ReduceMotion.System`), which drops it to no movement.
const ENTER = FadeIn.duration(duration.base).easing(easing.out);

export function EmptyState({ icon, title, message, fill = false }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Animated.View
      entering={ENTER}
      style={[styles.container, fill && styles.fill]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.well}>
        <Ionicons name={icon} size={26} color={colors.textTertiary} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    fill: { flex: 1 },
    well: {
      width: 56,
      height: 56,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: { ...type.headline, color: colors.textPrimary, textAlign: 'center' },
    message: {
      ...type.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 320,
    },
  });
}
