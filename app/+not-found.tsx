import { Link, Stack } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

export default function NotFoundScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.center}>
        <EmptyState
          icon="help-circle-outline"
          title="This screen doesn't exist"
          message="The link you followed points somewhere NextGleis doesn't have."
        />
        <Link href="/" style={styles.link}>
          Go to the home screen
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
