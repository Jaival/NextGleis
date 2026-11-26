import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

type Props = {
  overline?: string;
  title: string;
  // On the title row, right-aligned: a star, a clear button.
  right?: ReactNode;
  // Under the title: a search field, a From/To card.
  children?: ReactNode;
};

// The band at the top of a screen. It owns the top inset, so a screen that
// uses it renders `<ScreenContainer edges={[]}>`.
export function SignHeader({ overline, title, right, children }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);

  return (
    <View style={styles.band}>
      {overline ? (
        <Text style={styles.overline} numberOfLines={1}>
          {overline}
        </Text>
      ) : null}
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

function createStyles({ colors, type }: Theme, topInset: number) {
  return StyleSheet.create({
    band: {
      backgroundColor: colors.header,
      paddingTop: topInset + spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    overline: { ...type.overline, color: colors.headerForeground, opacity: 0.75 },
    // 44pt: the height of the buttons a screen puts on the right, so the band
    // does not grow when they appear.
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
    },
    title: { ...type.title, color: colors.headerForeground, flexShrink: 1 },
  });
}
