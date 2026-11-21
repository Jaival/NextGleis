import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import { useT } from '@/lib/i18n';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

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

// Mirrors DepartureListItem's geometry — same tile size, same badge size, same
// column widths — so real departures replace the placeholders without the list
// shifting under the user.
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
      <Animated.View style={[styles.tile, anim]} />
      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <Animated.View style={[styles.lineBadge, anim]} />
          <Animated.View style={[styles.bar, styles.directionBar, anim]} />
        </View>
        <Animated.View style={[styles.bar, styles.metaBar, anim]} />
      </View>
      <Animated.View style={[styles.bar, styles.countdownBar, anim]} />
    </View>
  );
}

export function BoardSkeleton({ label }: { label?: string } = {}) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View accessible accessibilityLabel={label ?? t('board.loading')} style={styles.container}>
      {Array.from({ length: ROWS }).map((_, i) => (
        <SkeletonRow key={i} index={i} styles={styles} />
      ))}
    </View>
  );
}

function createStyles({ colors, radii }: Theme) {
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
      backgroundColor: colors.card,
    },
    tile: {
      width: 64,
      height: 56,
      borderRadius: radii.md,
      borderCurve: 'continuous',
      backgroundColor: colors.skeleton,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    lineBadge: {
      width: 40,
      height: 24,
      borderRadius: radii.sm,
      borderCurve: 'continuous',
      backgroundColor: colors.skeleton,
    },
    middle: { flex: 1, gap: spacing.xs },
    bar: { height: 12, borderRadius: radii.pill, backgroundColor: colors.skeleton },
    directionBar: { flex: 1, maxWidth: '70%' },
    metaBar: { width: '45%', height: 14 },
    countdownBar: { width: 36, height: 28 },
  });
}
