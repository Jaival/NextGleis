import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { press } from './PressableScale';
import { tap } from '@/lib/haptics';
import { radii, spacing } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  /** The thing's name, used to build the reorder/remove control labels. */
  itemLabel: string;
  /** What tapping the card does, e.g. "Open departure board for Köln Hbf". */
  openLabel: string;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  children: ReactNode;
};

// The shared shell behind both favourite kinds: tinted icon well, content, and
// a quiet cluster of reorder/remove controls. Only the content differs between
// stations and routes, so that is the one thing passed as children.
//
// The card scales as a whole on press, but the open action is a *sibling* of
// the control buttons rather than their ancestor — nesting them would give the
// controls no independent accessible name (the outer button's label absorbs
// them) and is invalid DOM on web.
export function FavoriteCard({
  icon,
  itemLabel,
  openLabel,
  onPress,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
}: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

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
        <View style={styles.well}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.content}>{children}</View>
      </Pressable>
      <View style={styles.actions}>
        <ControlButton
          icon="chevron-up"
          label={`Move ${itemLabel} up`}
          onPress={onMoveUp}
          haptic="selection"
          styles={styles}
          colors={colors}
        />
        <ControlButton
          icon="chevron-down"
          label={`Move ${itemLabel} down`}
          onPress={onMoveDown}
          haptic="selection"
          styles={styles}
          colors={colors}
        />
        <ControlButton
          icon="close"
          label={`Remove ${itemLabel} from favorites`}
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
  colors: ReturnType<typeof useThemeColors>['colors'];
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
      <Ionicons name={icon} size={18} color={disabled ? colors.border : colors.textTertiary} />
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      paddingVertical: spacing.md,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
    },
    main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    well: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { flex: 1, gap: 2 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    control: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.pill,
    },
    controlPressed: { backgroundColor: colors.surfaceMuted },
  });
}
