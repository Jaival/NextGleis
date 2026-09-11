import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { StationSearchResult } from '@/types';

type Props = {
  station: StationSearchResult;
  onPress: () => void;
  accessibilityLabel?: string;
};

// Full-bleed row, so press feedback is a background wash rather than the scale
// used on inset cards — scaling an edge-to-edge row just exposes a sliver of
// the screen background down both sides.
export function StationResultItem({ station, onPress, accessibilityLabel }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `View departures for ${station.name}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.well}>
        <Ionicons name="location" size={16} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
        {/* Two networks can each have a stop by the same name (Alexanderplatz
            in Berlin and in Magdeburg's tram network); the source tells them
            apart. */}
        {station.network ? <Text style={styles.network}>{station.network}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowPressed: { backgroundColor: colors.surfaceMuted },
    well: {
      width: 32,
      height: 32,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1, gap: 2 },
    name: { ...type.subheadMedium, color: colors.textPrimary },
    network: { ...type.micro, color: colors.textTertiary },
  });
}
