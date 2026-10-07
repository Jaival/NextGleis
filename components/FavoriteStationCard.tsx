import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { FavoriteCard } from './FavoriteCard';
import { useT } from '@/lib/i18n';
import { type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { FavoriteStation } from '@/types';

type Props = {
  favorite: FavoriteStation;
  onPress: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
};

export function FavoriteStationCard({ favorite, onPress, onMoveUp, onMoveDown, onRemove }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const hiddenCount = favorite.hiddenLines.length;

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
      {hiddenCount > 0 ? (
        <Text style={styles.meta}>{t('favorites.linesHidden', hiddenCount)}</Text>
      ) : null}
    </FavoriteCard>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    name: { ...type.headlineMedium, color: colors.textPrimary },
    meta: { ...type.caption, color: colors.textTertiary },
  });
}
