import { isLoaded } from 'expo-font';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settingsStore';
import { buildTheme, SKIN_FONT_PROBE, type Theme } from './theme';

export function useTheme(): Theme {
  const mode = useSettingsStore((s) => s.themeMode);
  const skin = useSettingsStore((s) => s.skin);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const systemScheme = useColorScheme();

  // Anzeiger has one appearance: dark.
  const isDark =
    skin === 'anzeiger' || (mode === 'system' ? systemScheme === 'dark' : mode === 'dark');
  // The root layout holds the splash until the font files are loaded, so by the
  // time any screen renders this is settled.
  const probe = SKIN_FONT_PROBE[skin];
  const fontsLoaded = probe === undefined || isLoaded(probe);

  // One object per combination, so screens can key their memoised styles on it.
  return useMemo(
    () => buildTheme({ skin, isDark, highContrast, fontsLoaded }),
    [skin, isDark, highContrast, fontsLoaded],
  );
}
