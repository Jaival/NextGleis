import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
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
  const route = params.fromName && params.toName ? `${params.fromName} → ${params.toName}` : null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Routes</Text>
      </View>
      <EmptyState
        fill
        icon="construct-outline"
        title="Not available yet"
        message={
          route
            ? `Route search for ${route} is temporarily unavailable. Open the stations' boards in the meantime.`
            : 'Route search is temporarily unavailable. Departure boards for individual stations still work.'
        }
      />
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
    title: { ...type.largeTitle, color: colors.textPrimary },
  });
}
