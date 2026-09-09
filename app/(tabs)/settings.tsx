import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SegmentedControl } from '../../components/SegmentedControl';
import { PRIVACY_POLICY_URL } from '../../lib/api';
import { useSettingsStore } from '../../lib/settingsStore';
import { radii, spacing, type } from '../../lib/theme';
import { useThemeColors } from '../../lib/useThemeColors';

function LinkRow({ label, url, styles }: { label: string; url: string; styles: ReturnType<typeof createStyles> }) {
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

export default function SettingsScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SegmentedControl
            accessibilityLabel="Appearance"
            value={themeMode}
            onChange={setThemeMode}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data source</Text>
          <Text style={styles.paragraph}>
            Departure data is provided by Deutsche Bahn AG / DB InfraGO AG via the DB API
            Marketplace &quot;Timetables&quot; product, licensed under Creative Commons Attribution
            4.0 (CC BY 4.0).
          </Text>
          <LinkRow
            label="CC BY 4.0 license"
            url="https://creativecommons.org/licenses/by/4.0/"
            styles={styles}
          />
          <LinkRow
            label="DB terms of use"
            url="https://data.deutschebahn.com/nutzungsbedingungen.html"
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.paragraph}>
            No account is required. Favorite stations, favorite routes, and preferences are stored
            only on this device.
          </Text>
          <LinkRow label="Privacy policy" url={PRIVACY_POLICY_URL} styles={styles} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{version}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    container: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
    title: { ...type.title, color: colors.textPrimary, marginBottom: spacing.xs },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: { ...type.headline, color: colors.textPrimary },
    paragraph: { ...type.body, color: colors.textSecondary, lineHeight: 20 },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    linkText: { ...type.calloutMedium, color: colors.primary },
    linkChevron: { fontSize: 18, color: colors.primary }, // glyph size, not body text
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xs },
    label: { fontWeight: '600', color: colors.textPrimary },
    value: { color: colors.textSecondary },
  });
}
