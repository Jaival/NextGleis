import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PRIVACY_POLICY_URL } from '@/lib/api';
import { useSettingsStore } from '@/lib/settingsStore';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type Styles = ReturnType<typeof createStyles>;
type IconName = ComponentProps<typeof Ionicons>['name'];

// Mirrors NETWORKS in backend/lib/hafas/networks.ts.
const HAFAS_NETWORKS =
  'RMV, NVV, VBB, VBN, VOS, VSN, NAH.SH, INSA, VMT, RSAG, AVV, Saarfahrplan, S-Bahn München and INVG';

function Card({
  icon,
  title,
  children,
  styles,
  colors,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  styles: Styles;
  colors: ReturnType<typeof useThemeColors>['colors'];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={15} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function LinkRow({
  label,
  url,
  styles,
  colors,
}: {
  label: string;
  url: string;
  styles: Styles;
  colors: ReturnType<typeof useThemeColors>['colors'];
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
    >
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={colors.primary} />
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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Card icon="contrast-outline" title="Appearance" styles={styles} colors={colors}>
          <View style={styles.cardBody}>
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
        </Card>

        <Card icon="server-outline" title="Data sources" styles={styles} colors={colors}>
          <View style={styles.cardBody}>
            <Text style={styles.paragraph}>
              Departures and routes come from the journey planners of German transport networks —{' '}
              {HAFAS_NETWORKS} — through the open-source hafas-client library. The timetable data
              belongs to those networks and their operators.
            </Text>
            <Text style={styles.paragraph}>
              Stations saved in earlier versions of the app may fall back to data from Deutsche Bahn
              AG / DB InfraGO AG via the DB API Marketplace &quot;Timetables&quot; product, licensed
              under Creative Commons Attribution 4.0 (CC BY 4.0).
            </Text>
          </View>
          <LinkRow
            label="hafas-client"
            url="https://github.com/public-transport/hafas-client"
            styles={styles}
            colors={colors}
          />
          <LinkRow
            label="CC BY 4.0 license"
            url="https://creativecommons.org/licenses/by/4.0/"
            styles={styles}
            colors={colors}
          />
          <LinkRow
            label="DB terms of use"
            url="https://data.deutschebahn.com/nutzungsbedingungen.html"
            styles={styles}
            colors={colors}
          />
        </Card>

        <Card icon="lock-closed-outline" title="Privacy" styles={styles} colors={colors}>
          <View style={styles.cardBody}>
            <Text style={styles.paragraph}>
              No account is required. Favorite stations, favorite routes, and preferences are stored
              only on this device.
            </Text>
          </View>
          <LinkRow
            label="Privacy policy"
            url={PRIVACY_POLICY_URL}
            styles={styles}
            colors={colors}
          />
        </Card>

        <Text style={styles.version}>NextGleis {version}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    title: { ...type.largeTitle, color: colors.textPrimary, marginBottom: spacing.xs },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      boxShadow: colors.shadowCard,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    cardIcon: {
      width: 26,
      height: 26,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { ...type.headline, color: colors.textPrimary },
    cardBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
    paragraph: { ...type.body, color: colors.textSecondary, lineHeight: 20 },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    linkRowPressed: { backgroundColor: colors.surfaceMuted },
    linkText: { ...type.calloutMedium, color: colors.primary },
    version: {
      ...type.caption,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
}
