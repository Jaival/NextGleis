import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FavoriteCard } from './FavoriteCard';
import { useT } from '@/lib/i18n';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { FavoriteRoute } from '@/types';

type Props = {
  favorite: FavoriteRoute;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export function FavoriteRouteCard({ favorite, onPress, onMoveUp, onMoveDown, onRemove }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();
  const label = t('favorites.routeLabel', favorite.fromName, favorite.toName);

  return (
    <FavoriteCard
      icon="git-network"
      itemLabel={label}
      openLabel={t('favorites.openRoute', label)}
      onPress={onPress}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <Text style={styles.name} numberOfLines={1}>
        {favorite.fromName}
      </Text>
      <View style={styles.leg}>
        <Ionicons name="arrow-down" size={12} color={colors.mutedForeground} />
        <Text style={styles.name} numberOfLines={1}>
          {favorite.toName}
        </Text>
      </View>
    </FavoriteCard>
  );
}

function createStyles({ colors, type }: Theme) {
  return StyleSheet.create({
    name: { ...type.subheadMedium, color: colors.foreground, flexShrink: 1 },
    leg: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  });
}
