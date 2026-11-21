import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { PlatformTile } from './PlatformTile';
import { press } from './PressableScale';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { spacing, type Theme, type ThemeColors } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  /** The thing's name, used to build the reorder/remove control labels. */
  itemLabel: string;
  /** What tapping the card does, e.g. "Open departure board for Köln Hbf". */
  openLabel: string;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  // What the tile shows. The card sets `flush` itself: it clips its corners, so
  // a tile with its own radius would leave notches. Without a platform the tile
  // carries the train glyph.
  tile?: Omit<ComponentProps<typeof PlatformTile>, 'flush'>;
  children: ReactNode;
};

// The shared shell behind both favourite kinds: a sign tile, content, and
// a quiet cluster of reorder/remove controls. Only the content differs between
// stations and routes, so that is the one thing passed as children.
//
// The card scales as a whole on press, but the open action is a *sibling* of
// the control buttons rather than their ancestor — nesting them would give the
// controls no independent accessible name (the outer button's label absorbs
// them) and is invalid DOM on web.
export function FavoriteCard({
  itemLabel,
  openLabel,
  onPress,
  onMoveUp,
  onMoveDown,
  onRemove,
  tile = { kind: 'rail' },
  children,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  const t = useT();

  return (
    <Animated.View style={[styles.card, !reduced && press.base, pressed && !reduced && press.down]}>
      <Pressable
        style={styles.main}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        pressRetentionOffset={16}
        accessibilityRole="button"
        accessibilityLabel={openLabel}
      >
        <PlatformTile flush {...tile} />
        <View style={styles.content}>{children}</View>
      </Pressable>
      <View style={styles.actions}>
        <ControlButton
          icon="chevron-up"
          label={t('favorites.moveUp', itemLabel)}
          onPress={onMoveUp}
          haptic="selection"
          styles={styles}
          colors={colors}
        />
        <ControlButton
          icon="chevron-down"
          label={t('favorites.moveDown', itemLabel)}
          onPress={onMoveDown}
          haptic="selection"
          styles={styles}
          colors={colors}
        />
        <ControlButton
          icon="close"
          label={t('favorites.remove', itemLabel)}
          onPress={onRemove}
          haptic="medium"
          styles={styles}
          colors={colors}
        />
      </View>
    </Animated.View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  haptic,
  styles,
  colors,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  haptic: 'selection' | 'medium';
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const disabled = !onPress;
  return (
    <Pressable
      onPress={() => {
        tap[haptic]();
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      // The glyph is 18pt inside a 32pt button; hitSlop brings the target up to
      // the platform minimum without growing the visual.
      hitSlop={8}
      style={({ pressed }) => [styles.control, pressed && styles.controlPressed]}
    >
      <Ionicons name={icon} size={18} color={disabled ? colors.border : colors.mutedForeground} />
    </Pressable>
  );
}

function createStyles({ colors, radii }: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      paddingRight: spacing.sm,
      // Clips the tile to the card's corners; padding lives on the content so
      // the tile can sit flush against the edge.
      overflow: 'hidden',
    },
    main: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
    content: {
      flex: 1,
      gap: 2,
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    actions: { flexDirection: 'row', alignItems: 'center' },
    control: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.pill,
    },
    controlPressed: { backgroundColor: colors.muted },
  });
}
