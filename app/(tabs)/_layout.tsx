import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColors } from '@/lib/useThemeColors';

// Native system tab bar: a real Material `BottomNavigationView` on Android
// (ripple, active indicator pill, platform a11y) instead of the JS-drawn
// React Navigation bar. Icons are supplied per-platform — `md` names come from
// the Material Symbols catalog, `sf` from SF Symbols.
export default function TabsLayout() {
  const { colors } = useThemeColors();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.primary}
      iconColor={{ default: colors.textSecondary, selected: colors.primary }}
      indicatorColor={colors.primarySoft}
      rippleColor={colors.primarySoft}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.primary },
      }}
      // Let the platform decide whether to show labels at this item count,
      // rather than forcing them on.
      labelVisibilityMode="auto"
      // Lift the bar above the keyboard rather than letting the IME cover it.
      tabBarRespectsIMEInsets
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="routes">
        <NativeTabs.Trigger.Label>Routes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.triangle.branch" md="route" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
