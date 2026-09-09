import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, type } from '../lib/theme';
import { useThemeColors } from '../lib/useThemeColors';
import type { FavoriteRoute } from '../types';

type Props = {
  favorite: FavoriteRoute;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export function FavoriteRouteCard({ favorite, onPress, onMoveUp, onMoveDown, onRemove }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        main: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
        names: { flexShrink: 1 },
        name: { ...type.subheadMedium, color: colors.textPrimary },
        actions: { flexDirection: 'row', gap: spacing.xs },
        iconButton: { padding: spacing.xs },
      }),
    [colors],
  );

  const label = `${favorite.fromName} to ${favorite.toName}`;

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.main}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Find routes from ${label}`}
      >
        <Ionicons name="git-network" size={20} color={colors.primary} />
        <View style={styles.names}>
          <Text style={styles.name} numberOfLines={1}>
            {favorite.fromName}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            → {favorite.toName}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={onMoveUp}
          disabled={!onMoveUp}
          accessibilityRole="button"
          accessibilityLabel={`Move ${label} up`}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-up" size={18} color={onMoveUp ? colors.textSecondary : colors.border} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={!onMoveDown}
          accessibilityRole="button"
          accessibilityLabel={`Move ${label} down`}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-down" size={18} color={onMoveDown ? colors.textSecondary : colors.border} />
        </Pressable>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label} from favorites`}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
