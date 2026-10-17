import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

type Props = {
  label: string;
  // Which end of the list it extends: "earlier" sits on top, "later" below.
  direction: 'earlier' | 'later';
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
};

// A quiet text button at the top or bottom of a list that loads the next page
// in that direction. Not infinite scroll: every page is an upstream request, so
// it's the rider's call.
export function LoadMoreButton({ label, direction, loading, disabled = false, onPress }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons
          name={direction === 'earlier' ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.primary}
        />
      )}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
    },
    pressed: { backgroundColor: colors.muted },
    label: { ...type.calloutMedium, color: colors.primary },
  });
}
