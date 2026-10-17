import { Link, Stack } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useT } from '@/lib/i18n';
import { spacing, type Theme } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

function createStyles({ colors, type }: Theme) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    link: { ...type.calloutMedium, color: colors.primary, marginTop: spacing.md },
  });
}
