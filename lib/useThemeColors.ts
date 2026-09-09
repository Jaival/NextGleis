import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settingsStore';
import { darkColors, lightColors, type ThemeColors } from './theme';

export function useThemeColors(): { colors: ThemeColors; isDark: boolean } {
  const mode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
