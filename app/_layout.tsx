import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFavoritesStore } from '../lib/favoritesStore';
import { setupNetworkStatusForQueries } from '../lib/network';
import { queryClient } from '../lib/queryClient';

setupNetworkStatusForQueries();

export default function RootLayout() {
  useEffect(() => {
    useFavoritesStore.getState().hydrate();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="board/[evaNo]" options={{ headerShown: true }} />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
