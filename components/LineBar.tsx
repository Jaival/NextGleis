import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { lineBarSegments } from '@/lib/journeySteps';
import { productKind } from '@/lib/product';
import type { Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { JourneyLeg } from '@/types';

type Props = { legs: JourneyLeg[] };

// One coloured segment per ride, as wide as the ride is long.
export function LineBar({ legs }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const segments = lineBarSegments(legs);
  const total = segments.reduce((sum, segment) => sum + segment.minutes, 0);

  return (
    <View style={styles.bar} accessible={false}>
      {segments.map((segment, index) => {
        const product = theme.colors.product[productKind(segment.line)];
        return (
          <View
            key={index}
            // A two-minute bus must still have room for its label.
            style={[
              styles.segment,
              { flex: Math.max(segment.minutes, total * 0.14), backgroundColor: product.bg },
            ]}
          >
            <Text style={[styles.label, { color: product.fg }]} numberOfLines={1}>
              {segment.line || '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles({ type, radii }: Theme) {
  return StyleSheet.create({
    // minHeight, not height: at a large system font the label outgrows 18pt and a
    // fixed height would cut it. The segments stretch to the row.
    bar: { flexDirection: 'row', minHeight: 18, gap: 3 },
    segment: {
      borderRadius: radii.sm,
      borderCurve: 'continuous',
      paddingHorizontal: 5,
      justifyContent: 'center',
      // Lets a segment shrink below its label instead of pushing the bar wider
      // than the card.
      minWidth: 0,
      overflow: 'hidden',
    },
    label: { ...type.microBold },
  });
}
