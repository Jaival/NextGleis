import { useMemo, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/PressableScale';
import { useT } from '@/lib/i18n';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Props = {
  visible: boolean;
  title: string;
  // A text button opposite the title, e.g. "Now" or "Show all".
  action?: { label: string; onPress: () => void };
  // The full-width button at the bottom; closes the sheet when omitted.
  onDone?: () => void;
  onClose: () => void;
  children: ReactNode;
};

// A panel over the bottom of the screen, for a short choice that belongs to
// the screen underneath. Tapping outside or the back button closes it.
export function BottomSheet({ visible, title, action, onDone, onClose, children }: Props) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const t = useT();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />
        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
              {title}
            </Text>
            {action ? (
              <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={12}>
                <Text style={styles.action}>{action.label}</Text>
              </Pressable>
            ) : null}
          </View>

          {children}

          <PressableScale
            onPress={onDone ?? onClose}
            accessibilityRole="button"
            haptic="light"
            style={styles.done}
          >
            <Text style={styles.doneText}>{t('common.done')}</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      borderCurve: 'continuous',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.lg,
      boxShadow: colors.shadowRaised,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: { ...type.display, color: colors.textPrimary, flexShrink: 1 },
    action: { ...type.calloutMedium, color: colors.primary },
    done: {
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    doneText: { ...type.headline, color: colors.primaryOn },
  });
}
