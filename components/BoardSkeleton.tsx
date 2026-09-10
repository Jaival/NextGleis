import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { radii, spacing } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

const ROWS = 6;

// A loop with no state driving it, so it's a CSS animation rather than a
// shared value — it runs entirely on the UI thread and keeps running while the
// board request ties up JS.
const pulse = css.keyframes({
  from: { opacity: 0.45 },
  '50%': { opacity: 1 },
  to: { opacity: 0.45 },
});

const shimmer = css.create({
  bar: {
    animationName: pulse,
    animationDuration: '1400ms',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
});

// Mirrors DepartureListItem's geometry exactly — same badge size, same column
// widths, same row height — so real departures replace the placeholders
// without the list shifting under the user.
function SkeletonRow({
  index,
  styles,
}: {
  index: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const reduced = useReducedMotion();
  // Staggering the loop turns six synchronised blinks into one wave down the list.
  const anim = reduced ? null : [shimmer.bar, { animationDelay: index * 90 }];

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.lineBadge, anim]} />
      <View style={styles.middle}>
        <Animated.View style={[styles.bar, styles.directionBar, anim]} />
        <Animated.View style={[styles.bar, styles.platformBar, anim]} />
      </View>
      <View style={styles.right}>
        <Animated.View style={[styles.bar, styles.timeBar, anim]} />
        <Animated.View style={[styles.bar, styles.statusBar, anim]} />
      </View>
    </View>
  );
}

export function BoardSkeleton() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View accessible accessibilityLabel="Loading departures" style={styles.container}>
      {Array.from({ length: ROWS }).map((_, i) => (
        <SkeletonRow key={i} index={i} styles={styles} />
      ))}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    container: { paddingTop: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    lineBadge: {
      minWidth: 62,
      height: 30,
      borderRadius: radii.sm,
      borderCurve: 'continuous',
      backgroundColor: colors.skeleton,
    },
    middle: { flex: 1, gap: spacing.xs },
    bar: { height: 12, borderRadius: radii.pill, backgroundColor: colors.skeleton },
    directionBar: { width: '62%' },
    platformBar: { width: '34%', height: 14 },
    right: { alignItems: 'flex-end', gap: spacing.xs },
    timeBar: { width: 44, height: 16 },
    statusBar: { width: 56 },
  });
}
