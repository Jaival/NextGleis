import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tap } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { duration, easing } from '@/lib/motion';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';
import type { Notice } from '@/types';

const DETAILS_IN = FadeIn.duration(duration.fast).easing(easing.out);

// Disruption warnings (construction, diversions, replacement buses) are
// usually attached to every departure of the lines they affect — Frankfurt Hbf
// had one on 49 rows. Shown once here, collapsed, instead of on each row.
export function DisruptionBanner({ notices }: { notices: Notice[] }) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const [open, setOpen] = useState(false);

  if (notices.length === 0) return null;

  return (
    <View style={styles.banner}>
      <Pressable
        onPress={() => {
          tap.selection();
          setOpen((value) => !value);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityHint={open ? t('board.hideNotices') : t('board.showNotices')}
        style={styles.header}
      >
        <Ionicons name="warning" size={16} color={colors.delay} />
        <Text style={styles.headerText}>{t('board.disruptions', notices.length)}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.delay} />
      </Pressable>

      {open ? (
        <Animated.View entering={DETAILS_IN} style={styles.list}>
          {notices.map((notice) => (
            <View key={notice.text} style={styles.item}>
              {notice.title ? <Text style={styles.title}>{notice.title}</Text> : null}
              <Text style={styles.text}>{notice.text}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    banner: {
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
      backgroundColor: colors.delaySoft,
      borderRadius: radii.md,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    headerText: { flex: 1, ...type.footnoteBold, color: colors.delay },
    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
    item: { gap: 2 },
    title: { ...type.footnoteBold, color: colors.textPrimary },
    text: { ...type.footnote, color: colors.textSecondary, lineHeight: 18 },
  });
}
