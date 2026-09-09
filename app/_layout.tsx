import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFavoritesStore } from '../lib/favoritesStore';
import { useFavoriteRoutesStore } from '../lib/favoriteRoutesStore';
import { setupNetworkStatusForQueries } from '../lib/network';
import { queryClient } from '../lib/queryClient';
import { useSettingsStore } from '../lib/settingsStore';
import { useThemeColors } from '../lib/useThemeColors';

setupNetworkStatusForQueries();

export default function RootLayout() {
  const { colors, isDark } = useThemeColors();

  useEffect(() => {
    useFavoritesStore.getState().hydrate();
    useFavoriteRoutesStore.getState().hydrate();
    useSettingsStore.getState().hydrate();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.textPrimary,
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="board/[evaNo]" options={{ headerShown: true }} />
            </Stack>
          </ThemeProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
