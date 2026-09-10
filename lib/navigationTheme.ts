import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';
import { useMemo } from 'react';
import { useThemeColors } from './useThemeColors';

// React Navigation paints surfaces we don't style ourselves — the card
// background behind a screen transition, the header, the tab bar hairline. Left
// on the stock themes those use React Navigation's own blue/grey palette, which
// flashes against our colours mid-push. Feeding it the app palette keeps every
// navigator-owned surface consistent with the screens.
export function useNavigationTheme(): Theme {
  const { colors, isDark } = useThemeColors();

  return useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
      },
    };
  }, [colors, isDark]);
}
