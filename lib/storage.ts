import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, FavoriteRoute, FavoriteStation } from '@/types';
import { SKINS } from './palettes';

const FAVORITES_KEY = 'favorites';
const FAVORITE_ROUTES_KEY = 'favoriteRoutes';
const SETTINGS_KEY = 'settings';

// A half-written or hand-edited value would otherwise throw out of JSON.parse
// and reject the hydrate() call that awaits it. The root layout holds the
// splash screen until every store reports hydrated, so an unhandled throw here
// would strand the app on the splash screen permanently. Treat unreadable
// persisted state as absent instead.
async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] discarding unreadable value for "${key}"`, error);
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // The in-memory store is already updated; losing the write only costs
    // persistence across restarts, which is not worth crashing over.
    console.warn(`[storage] failed to persist "${key}"`, error);
  }
}

export async function getFavorites(): Promise<FavoriteStation[]> {
  const favorites = await readJson<FavoriteStation[]>(FAVORITES_KEY, []);
  return Array.isArray(favorites) ? favorites : [];
}

export async function saveFavorites(favorites: FavoriteStation[]): Promise<void> {
  await writeJson(FAVORITES_KEY, favorites);
}

export async function getFavoriteRoutes(): Promise<FavoriteRoute[]> {
  const routes = await readJson<FavoriteRoute[]>(FAVORITE_ROUTES_KEY, []);
  return Array.isArray(routes) ? routes : [];
}

export async function saveFavoriteRoutes(routes: FavoriteRoute[]): Promise<void> {
  await writeJson(FAVORITE_ROUTES_KEY, routes);
}

const defaultSettings: AppSettings = {
  themeMode: 'system',
  skin: 'bahnsteig',
  highContrast: false,
  language: 'system',
  onboarded: false,
  deutschlandticket: false,
  locationEnabled: true,
  diagnosticsEnabled: true,
};

export async function getSettings(): Promise<AppSettings> {
  // `colorTheme` and `uiStyle` are from the five-theme design; the app was not
  // on the store then, so they are dropped rather than migrated.
  const {
    colorTheme: _colorTheme,
    uiStyle: _uiStyle,
    ...stored
  } = await readJson<Partial<AppSettings> & { colorTheme?: unknown; uiStyle?: unknown }>(
    SETTINGS_KEY,
    {},
  );
  const settings = { ...defaultSettings, ...stored };
  // A skin removed in a later version must not leave the app looking up a
  // palette that no longer exists.
  if (!SKINS.includes(settings.skin)) settings.skin = defaultSettings.skin;
  return settings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await writeJson(SETTINGS_KEY, settings);
}
