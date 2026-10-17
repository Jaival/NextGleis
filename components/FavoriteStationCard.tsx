import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { FavoriteCard } from './FavoriteCard';
import { useT } from '@/lib/i18n';
import { type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';
import type { FavoriteStation } from '@/types';

type Props = {
  favorite: FavoriteStation;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export function FavoriteStationCard({ favorite, onPress, onMoveUp, onMoveDown, onRemove }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const t = useT();
  const hiddenLines = favorite.hiddenLines.length;
  const hiddenDirections = favorite.hiddenDirections?.length ?? 0;
  const filters = [
    hiddenLines > 0 ? t('favorites.linesHidden', hiddenLines) : null,
    hiddenDirections > 0 ? t('favorites.directionsHidden', hiddenDirections) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <FavoriteCard
      icon="train"
      itemLabel={favorite.name}
      openLabel={t('favorites.openBoard', favorite.name)}
      onPress={onPress}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onRemove={onRemove}
    >
      <Text style={styles.name} numberOfLines={1}>
        {favorite.name}
      </Text>
      {filters ? <Text style={styles.meta}>{filters}</Text> : null}
    </FavoriteCard>
  );
}

function createStyles({ colors, type }: Theme) {
  return StyleSheet.create({
    name: { ...type.headlineMedium, color: colors.foreground },
    meta: { ...type.caption, color: colors.mutedForeground },
  });
}
