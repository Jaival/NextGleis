import { isLoaded } from 'expo-font';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settingsStore';
import { buildTheme, type Theme } from './theme';

export function useTheme(): Theme {
  const mode = useSettingsStore((s) => s.themeMode);
  const name = useSettingsStore((s) => s.colorTheme);
  const style = useSettingsStore((s) => s.uiStyle);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const systemScheme = useColorScheme();

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  // The root layout holds the splash until the font files are loaded, so by the
  // time any screen renders this is settled.
  const fontsLoaded = style === 'modern' && isLoaded('Manrope_400Regular');

  // One object per combination, so screens can key their memoised styles on it.
  return useMemo(
    () => buildTheme({ name, style, isDark, highContrast, fontsLoaded }),
    [name, style, isDark, highContrast, fontsLoaded],
  );
}
