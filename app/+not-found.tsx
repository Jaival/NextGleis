import { Link, Stack } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useT } from '@/lib/i18n';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

export default function NotFoundScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={styles.center}>
        <EmptyState
          icon="help-circle-outline"
          title={t('notFound.heading')}
          message={t('notFound.message')}
        />
        <Link href="/" style={styles.link}>
          {t('notFound.home')}
        </Link>
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    link: { ...type.calloutMedium, color: colors.primary, marginTop: spacing.md },
  });
}
