import { Ionicons } from '@expo/vector-icons';
import { Fragment, useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { duration, easing } from '@/lib/motion';
import { radii, spacing, type } from '@/lib/theme';
import { useNearbyStops } from '@/lib/useNearbyStops';
import { useThemeColors } from '@/lib/useThemeColors';
import type { NearbyStop } from '@/types';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Styles = ReturnType<typeof createStyles>;

// Enough to cover the stops around a typical interchange without pushing the
// favourites off the first screen.
const MAX_SHOWN = 4;
const LIST_IN = FadeIn.duration(duration.base).easing(easing.out);

// The first thing a new user sees with no favourites yet, and a shortcut for
// everyone else when they're somewhere unfamiliar. Renders nothing until the
// permission status is known, so it never flashes the "ask" card at someone
// who already allowed it.
export function NearbySection({ onOpen }: { onOpen: (stop: NearbyStop) => void }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const nearby = useNearbyStops();
  const { permission } = nearby;

  if (!permission) return null;

  if (!permission.granted) {
    const canAsk = permission.canAskAgain;
    return (
      <View style={[styles.card, styles.prompt]}>
        <View style={styles.promptWell}>
          <Ionicons name="navigate" size={18} color={colors.primary} />
        </View>
        <View style={styles.promptText}>
          <Text style={styles.promptTitle}>
            {canAsk ? t('nearby.askTitle') : t('nearby.deniedTitle')}
          </Text>
          <Text style={styles.promptMessage}>
            {canAsk ? t('nearby.askMessage') : t('nearby.deniedMessage')}
          </Text>
          <Pressable
            onPress={() => {
              tap.light();
              if (canAsk) nearby.requestPermission();
              else Linking.openSettings();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>
              {canAsk ? t('nearby.askButton') : t('nearby.openSettings')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (nearby.isLoading) {
    return (
      <View style={[styles.card, styles.status]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (nearby.isError || nearby.isOffline) {
    return (
      <View style={[styles.card, styles.status]}>
        <Text style={styles.statusText}>
          {nearby.isOffline ? t('common.offline') : t('nearby.error')}
        </Text>
        {nearby.isError ? (
          <Pressable onPress={nearby.retry} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>{t('nearby.retry')}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const stops = (nearby.stops ?? []).slice(0, MAX_SHOWN);
  if (stops.length === 0) {
    return (
      <View style={[styles.card, styles.status]}>
        <Text style={styles.statusText}>{t('nearby.empty')}</Text>
      </View>
    );
  }

  return (
    <Animated.View entering={LIST_IN} style={styles.card}>
      {stops.map((stop, index) => (
        <Fragment key={stop.evaNo}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <NearbyRow stop={stop} onPress={() => onOpen(stop)} styles={styles} colors={colors} />
        </Fragment>
      ))}
    </Animated.View>
  );
}

function NearbyRow({
  stop,
  onPress,
  styles,
  colors,
}: {
  stop: NearbyStop;
  onPress: () => void;
  styles: Styles;
  colors: Colors;
}) {
  const t = useT();
  const distance = t('common.distance', stop.distance);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('nearby.itemLabel', stop.name, distance)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Ionicons name="walk-outline" size={18} color={colors.primary} />
      <View style={styles.rowText}>
        <Text style={styles.name} numberOfLines={1}>
          {stop.name}
        </Text>
        {stop.network ? <Text style={styles.network}>{stop.network}</Text> : null}
      </View>
      <Text style={styles.distance}>{distance}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      overflow: 'hidden',
    },
    prompt: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
    promptWell: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    promptText: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
    promptTitle: { ...type.headlineMedium, color: colors.textPrimary },
    promptMessage: { ...type.footnote, color: colors.textSecondary, lineHeight: 18 },
    button: {
      marginTop: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    buttonPressed: { opacity: 0.85 },
    buttonText: { ...type.calloutBold, color: colors.primaryOn },
    // Same height as two rows, so the swap to the list doesn't jump the page.
    status: {
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      padding: spacing.md,
    },
    statusText: { ...type.footnote, color: colors.textSecondary, textAlign: 'center' },
    link: { ...type.calloutMedium, color: colors.primary },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    rowPressed: { backgroundColor: colors.surfaceMuted },
    rowText: { flex: 1, gap: 2 },
    name: { ...type.subheadMedium, color: colors.textPrimary },
    network: { ...type.micro, color: colors.textTertiary },
    distance: { ...type.footnoteMedium, color: colors.textSecondary },
    // Starts where the stop names do, like the Routes card.
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md + 18 + spacing.md,
    },
  });
}
