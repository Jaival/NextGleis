import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, FavoriteRoute, FavoriteStation } from '../types';

const FAVORITES_KEY = 'favorites';
const FAVORITE_ROUTES_KEY = 'favoriteRoutes';
const SETTINGS_KEY = 'settings';

export async function getFavorites(): Promise<FavoriteStation[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FavoriteStation[];
}

export async function saveFavorites(favorites: FavoriteStation[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export async function getFavoriteRoutes(): Promise<FavoriteRoute[]> {
  const raw = await AsyncStorage.getItem(FAVORITE_ROUTES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FavoriteRoute[];
}

export async function saveFavoriteRoutes(routes: FavoriteRoute[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITE_ROUTES_KEY, JSON.stringify(routes));
}

const defaultSettings: AppSettings = {
  themeMode: 'system',
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  return { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
