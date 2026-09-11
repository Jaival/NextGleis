import { StyleSheet, Text, View } from 'react-native';
import { productKind } from '@/lib/product';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Props = { line: string; compact?: boolean };

// The coloured line badge — the product decides the fill (see lib/product.ts).
// Full size as a board's first column; compact where several sit in a row,
// as in a journey summary.
export function LineBadge({ line, compact = false }: Props) {
  const { colors } = useThemeColors();
  const product = colors.product[productKind(line)];

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

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.sm,
    height: 30,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCompact: { height: 24, minWidth: 0, paddingHorizontal: spacing.sm - 2 },
  text: { ...type.footnoteBold },
  textCompact: { ...type.microBold },
});
