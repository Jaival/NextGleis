import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { radii, spacing } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

function SkeletonRow({
  opacity,
  styles,
}: {
  opacity: Animated.Value;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <Animated.View style={[styles.lineBadge, { opacity }]} />
      <View style={styles.middle}>
        <Animated.View style={[styles.bar, styles.directionBar, { opacity }]} />
        <Animated.View style={[styles.bar, styles.platformBar, { opacity }]} />
      </View>
      <View style={styles.right}>
        <Animated.View style={[styles.bar, styles.timeBar, { opacity }]} />
        <Animated.View style={[styles.bar, styles.badgeBar, { opacity }]} />
      </View>
    </View>
  );
}

export function BoardSkeleton() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Lazy `useState` initialiser rather than `useRef(...).current`: reading a
  // ref during render is unsafe under concurrent rendering, and constructing
  // the Animated.Value inline would allocate a fresh one every render.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View accessible accessibilityLabel="Loading departures" style={styles.container}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} opacity={opacity} styles={styles} />
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    lineBadge: { width: 64, height: 28, borderRadius: radii.sm, backgroundColor: colors.border },
    middle: { flex: 1, gap: spacing.xs },
    bar: { height: 12, borderRadius: radii.pill, backgroundColor: colors.border },
    directionBar: { width: '60%' },
    platformBar: { width: '35%' },
    right: { alignItems: 'flex-end', gap: spacing.xs },
    timeBar: { width: 40 },
    badgeBar: { width: 56, height: 16 },
  });
}
