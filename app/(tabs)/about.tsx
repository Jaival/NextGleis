import Constants from 'expo-constants';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PRIVACY_POLICY_URL } from '../../lib/api';
import { colors, radii, spacing } from '../../lib/theme';

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={styles.linkRow}
    >
      <Text style={styles.linkText}>{label}</Text>
      <Text style={styles.linkChevron}>›</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>About NextGleis</Text>
        <Text style={styles.paragraph}>
          NextGleis shows live departure boards for German bus and train stops, with per-line
          filtering and one-tap access to your regular stations.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data source</Text>
          <Text style={styles.paragraph}>
            Departure data is provided by Deutsche Bahn AG / DB InfraGO AG via the DB API
            Marketplace &quot;Timetables&quot; product, licensed under Creative Commons Attribution
            4.0 (CC BY 4.0).
          </Text>
          <LinkRow label="CC BY 4.0 license" url="https://creativecommons.org/licenses/by/4.0/" />
          <LinkRow
            label="DB terms of use"
            url="https://data.deutschebahn.com/nutzungsbedingungen.html"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.paragraph}>
            No account is required. Favorite stations and line filters are stored only on this
            device.
          </Text>
          <LinkRow label="Privacy policy" url={PRIVACY_POLICY_URL} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{version}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  paragraph: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  linkChevron: { fontSize: 18, color: colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
  label: { fontWeight: '600', color: colors.textPrimary },
  value: { color: colors.textSecondary },
});
