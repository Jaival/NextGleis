import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/PressableScale';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useT } from '@/lib/i18n';
import { duration, easing } from '@/lib/motion';
import { useSettingsStore } from '@/lib/settingsStore';
import { radii, spacing, type } from '@/lib/theme';
import { useThemeColors } from '@/lib/useThemeColors';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STAGGER_MS = 60;
const enter = (index: number) =>
  FadeInDown.duration(duration.base)
    .easing(easing.out)
    .delay(index * STAGGER_MS);

// Shown once, on first launch. It does two jobs: say in three lines what the
// app is for, and offer location — so the first Home screen a new user sees
// lists real stops around them rather than two empty sections. Location is
// asked for only when the user taps the button, never on load.
export default function OnboardingScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const t = useT();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [busy, setBusy] = useState(false);

  const finish = async (withLocation: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      // Whatever the answer, Home handles it: a granted permission shows
      // nearby stops, a refusal shows the opt-in card there instead.
      if (withLocation) await Location.requestForegroundPermissionsAsync();
    } finally {
      await completeOnboarding();
      router.replace('/');
    }
  };

  const features: { icon: IconName; title: string; text: string }[] = [
    { icon: 'time', title: t('onboarding.boardsTitle'), text: t('onboarding.boardsText') },
    { icon: 'funnel', title: t('onboarding.filterTitle'), text: t('onboarding.filterText') },
    { icon: 'git-network', title: t('onboarding.routesTitle'), text: t('onboarding.routesText') },
  ];

  return (
    // Outside the tabs, so this screen owns the bottom inset too.
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)} style={styles.hero}>
          <View style={styles.logo}>
            <Ionicons name="train" size={32} color={colors.primaryOn} />
          </View>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
        </Animated.View>

        <View style={styles.features}>
          {features.map((feature, index) => (
            <Animated.View key={feature.icon} entering={enter(index + 1)} style={styles.feature}>
              <View style={styles.well}>
                <Ionicons name={feature.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBody}>{feature.text}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={enter(features.length + 1)} style={styles.location}>
          <Ionicons name="navigate" size={20} color={colors.primary} />
          <Text style={styles.locationTitle}>{t('onboarding.locationTitle')}</Text>
          <Text style={styles.locationText}>{t('onboarding.locationText')}</Text>
        </Animated.View>
      </ScrollView>

      <View style={styles.actions}>
        <PressableScale
          haptic="light"
          onPress={() => finish(true)}
          disabled={busy}
          accessibilityRole="button"
          style={styles.primary}
        >
          <Text style={styles.primaryText}>{t('onboarding.useLocation')}</Text>
        </PressableScale>
        <Pressable
          onPress={() => finish(false)}
          disabled={busy}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors: ReturnType<typeof useThemeColors>['colors']) {
  return StyleSheet.create({
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    hero: { gap: spacing.sm },
    logo: {
      width: 64,
      height: 64,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...type.largeTitle, color: colors.textPrimary },
    subtitle: { ...type.body, color: colors.textSecondary, lineHeight: 20 },
    features: { gap: spacing.lg },
    feature: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
    well: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: { flex: 1, gap: 2 },
    featureTitle: { ...type.headlineMedium, color: colors.textPrimary },
    featureBody: { ...type.footnote, color: colors.textSecondary, lineHeight: 18 },
    location: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderCurve: 'continuous',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    locationTitle: { ...type.headlineMedium, color: colors.textPrimary, marginTop: spacing.xs },
    locationText: { ...type.footnote, color: colors.textSecondary, lineHeight: 18 },
    actions: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
      alignItems: 'stretch',
    },
    primary: {
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    primaryText: { ...type.headline, color: colors.primaryOn },
    secondary: { paddingVertical: spacing.sm, alignItems: 'center' },
    secondaryText: { ...type.calloutMedium, color: colors.primary },
  });
}
