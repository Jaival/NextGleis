import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { StationSearchResult } from '@/types';

type Props = { station: StationSearchResult; onPress: () => void };

export function StationResultItem({ station, onPress }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        },
        name: { flex: 1, ...type.subhead, color: colors.textPrimary },
      }),
    [colors],
  );

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View departures for ${station.name}`}
    >
      <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
      <Text style={styles.name} numberOfLines={1}>
        {station.name}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}
