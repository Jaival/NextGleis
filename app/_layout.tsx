import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFavoritesStore } from '@/lib/favoritesStore';
import { useFavoriteRoutesStore } from '@/lib/favoriteRoutesStore';
import { useNavigationTheme } from '@/lib/navigationTheme';
import { setupNetworkStatusForQueries } from '@/lib/network';
import { queryClient } from '@/lib/queryClient';
import { useSettingsStore } from '@/lib/settingsStore';
import { MODERN_FONTS } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

setupNetworkStatusForQueries();

// Hold the native splash until the persisted stores are read back, so the first
// frame shows real favorites instead of the empty state flashing into content.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, isDark, type } = useTheme();
  const navigationTheme = useNavigationTheme();
  const reducedMotion = useReducedMotion();

  const favoritesHydrated = useFavoritesStore((s) => s.hydrated);
  const routesHydrated = useFavoriteRoutesStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  // The Modern style's font files. Loaded whatever the style, so switching to
  // it in Settings is instant; a failed load leaves Modern on the system font.
  const [fontsLoaded, fontError] = useFonts(MODERN_FONTS);
  const hydrated =
    favoritesHydrated && routesHydrated && settingsHydrated && (fontsLoaded || !!fontError);

  useEffect(() => {
    useFavoritesStore.getState().hydrate();
    useFavoriteRoutesStore.getState().hydrate();
    useSettingsStore.getState().hydrate();
  }, []);

  // The window background sits behind every screen; on Android it is what shows
  // during activity start and between screen transitions, so leaving it at the
  // platform default flashes white when the app is in dark mode.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                // Flat header on the screen background rather than a raised
                // `surface` bar: the board's filter row already draws the only
                // separator that region needs, and two stacked bars read as the
                // chrome-heavy style this design is moving away from.
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerTintColor: colors.foreground,
                headerTitleStyle: { ...type.headline, color: colors.foreground },
                // Screen transitions stay native — never rebuilt in JS — so the
                // interactive back gesture and platform timing come for free.
                animation: reducedMotion ? 'fade' : 'default',
              }}
            >
              <Stack.Screen name="(tabs)" />
              {/* Reached by a redirect from Home, so there is nothing behind
                  it to swipe back to. */}
              <Stack.Screen
                name="onboarding"
                options={{ gestureEnabled: false, animation: 'fade' }}
              />
              <Stack.Screen name="board/[evaNo]" options={{ headerShown: true }} />
              <Stack.Screen name="trip/[id]" options={{ headerShown: true }} />
            </Stack>
          </ThemeProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
