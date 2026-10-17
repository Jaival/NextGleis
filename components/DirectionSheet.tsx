import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
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
                color={shown ? colors.primary : colors.mutedForeground}
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

function createStyles({ colors, type, radii }: Theme) {
  return StyleSheet.create({
    message: { ...type.footnote, color: colors.mutedForeground, marginTop: -spacing.sm },
    list: { flexGrow: 0 },
    listContent: { gap: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.sm,
    },
    rowPressed: { backgroundColor: colors.muted },
    direction: { ...type.subheadMedium, color: colors.foreground, flex: 1 },
    directionHidden: { color: colors.mutedForeground },
  });
}
