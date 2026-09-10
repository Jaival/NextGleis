import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

// Route/journey search needs a trip-planning API — DB's Timetables product only
// returns single-station boards, no multi-leg journeys. Disabled until there's
// a DB-backed (non-free-community) source for this.
export default function RoutesScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ fromName?: string; toName?: string }>();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Routes</Text>
      </View>
      <View style={styles.empty} accessibilityLiveRegion="polite">
        <Text style={styles.emptyText}>
          {params.fromName && params.toName
            ? `Route search for ${params.fromName} → ${params.toName} is temporarily unavailable.`
            : 'Route search is temporarily unavailable.'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    header: { padding: spacing.lg, paddingBottom: spacing.md },
    title: { ...type.title, color: colors.textPrimary },
    empty: { paddingTop: spacing.xl, paddingHorizontal: spacing.xl, alignItems: 'center' },
    emptyText: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  });
}
