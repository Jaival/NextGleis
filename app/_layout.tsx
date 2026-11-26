import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ObserveErrorBoundary, ObserveRoot, useObserve } from 'expo-observe';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { useT } from '@/lib/i18n';
import { useFavoritesStore } from '@/lib/favoritesStore';
import { useFavoriteRoutesStore } from '@/lib/favoriteRoutesStore';
import { useNavigationTheme } from '@/lib/navigationTheme';
import { setupNetworkStatusForQueries } from '@/lib/network';
import { queryClient } from '@/lib/queryClient';
import { useSettingsStore } from '@/lib/settingsStore';
import { SKIN_FONTS } from '@/lib/theme';
import { useTheme } from '@/lib/useTheme';

setupNetworkStatusForQueries();

// Hold the native splash until the persisted stores are read back, so the first
// frame shows real favorites instead of the empty state flashing into content.
SplashScreen.preventAutoHideAsync();

// What a render error leaves on screen instead of a closed app. The boundary
// has already reported the error; "Try again" re-mounts the navigator.
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { colors, type } = useTheme();
  const t = useT();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <EmptyState
        icon="alert-circle-outline"
        title={t('error.title')}
        message={t('error.message')}
      />
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={{ alignSelf: 'center', padding: 12 }}
      >
        <Text style={{ ...type.headline, color: colors.primary }}>{t('error.retry')}</Text>
      </Pressable>
    </View>
  );
}

function RootLayout() {
  const { colors, statusBarStyle, type } = useTheme();
  const { markInteractive } = useObserve();
  const navigationTheme = useNavigationTheme();
  const reducedMotion = useReducedMotion();

  const favoritesHydrated = useFavoritesStore((s) => s.hydrated);
  const routesHydrated = useFavoriteRoutesStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  // The Anzeiger and Netzplan font files. Loaded whatever the skin, so
  // switching in Settings is instant; a failed load leaves a skin on the system
  // font.
  const [fontsLoaded, fontError] = useFonts(SKIN_FONTS);
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
    if (!hydrated) return;
    SplashScreen.hideAsync();
    // The stores and fonts are in, so the first screen can be used.
    markInteractive();
  }, [hydrated, markInteractive]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>
            <ObserveErrorBoundary
              fallback={({ resetError }) => <ErrorScreen onRetry={resetError} />}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  // The sign band: the same `header` colour as SignHeader on the
                  // tab screens, so the top of every screen reads as one family.
                  // Flat, not a raised bar: the board's filter row already draws
                  // the only separator that region needs.
                  headerStyle: { backgroundColor: colors.header },
                  headerShadowVisible: false,
                  headerTintColor: colors.headerForeground,
                  headerTitleStyle: { ...type.headline, color: colors.headerForeground },
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
                <Stack.Screen name="journey" options={{ headerShown: true }} />
              </Stack>
            </ObserveErrorBoundary>
          </ThemeProvider>
          <StatusBar style={statusBarStyle} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default ObserveRoot.wrap(RootLayout);
