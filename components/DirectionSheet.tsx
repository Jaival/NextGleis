import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Props = {
  visible: boolean;
  // Kept by the caller after closing, so the sheet doesn't empty out while it
  // fades away.
  line: string;
  directions: string[];
  hidden: (direction: string) => boolean;
  onToggle: (direction: string) => void;
  onShowAll: () => void;
  onClose: () => void;
};

// The per-direction line filter (spec §7.4): one line's destinations on this
// board, each shown or hidden. Every tap applies at once — the board behind
// updates while the sheet is open.
export function DirectionSheet({
  visible,
  line,
  directions,
  hidden,
  onToggle,
  onShowAll,
  onClose,
}: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();

  return (
    <BottomSheet
      visible={visible}
      title={line}
      action={{ label: t('board.showAll'), onPress: onShowAll }}
      onClose={onClose}
    >
      <Text style={styles.message}>{t('board.directionsMessage')}</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {directions.map((direction) => {
          const shown = !hidden(direction);
          return (
            <Pressable
              key={direction}
              onPress={() => {
                tap.selection();
                onToggle(direction);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: shown }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Ionicons
                name={shown ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={shown ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.direction, !shown && styles.directionHidden]} numberOfLines={2}>
                {direction}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    message: { ...type.footnote, color: colors.textSecondary, marginTop: -spacing.sm },
    list: { flexGrow: 0 },
    listContent: { gap: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.sm,
    },
    rowPressed: { backgroundColor: colors.surfaceMuted },
    direction: { ...type.subheadMedium, color: colors.textPrimary, flex: 1 },
    directionHidden: { color: colors.textTertiary },
  });
}
