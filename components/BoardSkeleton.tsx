import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';

function SkeletonRow({ opacity }: { opacity: Animated.Value }) {
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
  const opacity = useRef(new Animated.Value(0.4)).current;

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
        <SkeletonRow key={i} opacity={opacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
  bar: { height: 12, borderRadius: 4, backgroundColor: colors.border },
  directionBar: { width: '60%' },
  platformBar: { width: '35%' },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  timeBar: { width: 40 },
  badgeBar: { width: 56, height: 16 },
});
