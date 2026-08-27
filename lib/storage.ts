import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoriteStation } from '../types';

const FAVORITES_KEY = 'favorites';

export async function getFavorites(): Promise<FavoriteStation[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as FavoriteStation[];
}

export async function saveFavorites(favorites: FavoriteStation[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}
