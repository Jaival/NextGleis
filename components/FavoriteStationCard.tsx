import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';
import type { FavoriteStation } from '../types';

type Props = {
  favorite: FavoriteStation;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export function FavoriteStationCard({ favorite, onPress, onMoveUp, onMoveDown, onRemove }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.main}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open departure board for ${favorite.name}`}
      >
        <Ionicons name="train" size={20} color={colors.primary} />
        <Text style={styles.name} numberOfLines={1}>
          {favorite.name}
        </Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={onMoveUp}
          disabled={!onMoveUp}
          accessibilityRole="button"
          accessibilityLabel={`Move ${favorite.name} up`}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-up" size={18} color={onMoveUp ? colors.textSecondary : colors.border} />
        </Pressable>
        <Pressable
          onPress={onMoveDown}
          disabled={!onMoveDown}
          accessibilityRole="button"
          accessibilityLabel={`Move ${favorite.name} down`}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-down" size={18} color={onMoveDown ? colors.textSecondary : colors.border} />
        </Pressable>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${favorite.name} from favorites`}
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: { padding: spacing.xs },
});
