import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { productKind } from '@/lib/product';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

type Props = { line: string; compact?: boolean };

// The coloured line badge — the product decides the fill (see lib/product.ts).
// Full size as a board's first column; compact where several sit in a row,
// as in a journey summary.
export function LineBadge({ line, compact = false }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const product = theme.colors.product[productKind(line)];

  return (
    <View style={[styles.badge, compact && styles.badgeCompact, { backgroundColor: product.bg }]}>
      <Text
        style={[styles.text, compact && styles.textCompact, { color: product.fg }]}
        numberOfLines={1}
      >
        {line || '—'}
      </Text>
    </View>
  );
}

function createStyles({ type, radii }: Theme) {
  return StyleSheet.create({
    // minHeight, not height: with a large system text size the label grows past
    // 30pt and a fixed height would clip it.
    badge: {
      borderRadius: radii.sm,
      borderCurve: 'continuous',
      paddingHorizontal: spacing.sm,
      minHeight: 30,
      minWidth: 62,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeCompact: { minHeight: 24, minWidth: 0, paddingHorizontal: spacing.sm - 2 },
    text: { ...type.footnoteBold },
    textCompact: { ...type.microBold },
  });
}
