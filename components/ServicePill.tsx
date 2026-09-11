import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { ServiceKind } from '@/types';

const LABELS: Record<ServiceKind, string> = { db: 'DB', rail: 'Train', transit: 'Local' };

const ICONS: Record<Exclude<ServiceKind, 'db'>, ComponentProps<typeof Ionicons>['name']> = {
  rail: 'train-outline',
  transit: 'bus-outline',
};

// For the accessibility labels of the rows the pill sits in.
export const SERVICE_DESCRIPTIONS: Record<ServiceKind, string> = {
  db: 'Deutsche Bahn train',
  rail: 'train',
  transit: 'local public transport',
};

// Tells a Deutsche Bahn train apart from other operators' trains and from
// local public transport (bus, tram, U-Bahn) at a glance. DB is the one filled
// pill on a board, in its brand red; the other two stay outlined and quiet so
// the board doesn't turn into a wall of badges.
export function ServicePill({ kind }: { kind: ServiceKind }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (kind === 'db') {
    return (
      <View style={[styles.pill, styles.db]}>
        <Text style={[styles.label, styles.dbLabel]}>{LABELS.db}</Text>
      </View>
    );
  }

  return (
    <View style={styles.pill}>
      <Ionicons name={ICONS[kind]} size={11} color={colors.textSecondary} />
      <Text style={styles.label}>{LABELS[kind]}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      borderRadius: radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      paddingHorizontal: spacing.sm - 2,
      paddingVertical: 1,
    },
    db: { backgroundColor: colors.serviceDb, borderColor: colors.serviceDb },
    label: { ...type.microBold, color: colors.textSecondary },
    dbLabel: { color: colors.serviceDbOn, letterSpacing: 0.4 },
  });
}
