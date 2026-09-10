import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FavoriteCard } from './FavoriteCard';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { FavoriteRoute } from '@/types';

type Props = {
  favorite: FavoriteRoute;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export function FavoriteRouteCard({ favorite, onPress, onMoveUp, onMoveDown, onRemove }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const label = `${favorite.fromName} to ${favorite.toName}`;

  return (
    <FavoriteCard
      icon="git-network"
      itemLabel={label}
      openLabel={`Find routes from ${label}`}
      onPress={onPress}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <Text style={styles.name} numberOfLines={1}>
        {favorite.fromName}
      </Text>
      <View style={styles.leg}>
        <Ionicons name="arrow-down" size={12} color={colors.textTertiary} />
        <Text style={styles.name} numberOfLines={1}>
          {favorite.toName}
        </Text>
      </View>
    </FavoriteCard>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    name: { ...type.subheadMedium, color: colors.textPrimary, flexShrink: 1 },
    leg: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  });
}
