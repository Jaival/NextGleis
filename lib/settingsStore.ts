import { Appearance } from 'react-native';
import { create } from 'zustand';
import { getSettings, saveSettings } from './storage';
import type { AppSettings, ColorTheme, LanguageSetting, ThemeMode, UiStyle } from '@/types';

// Makes native-rendered chrome (dialogs, keyboard, etc.) follow the in-app
// theme override instead of only the OS-level system setting.
//
// react-native-web has no `setColorScheme`, and calling it there threw out of
// `hydrate()` as an unhandled rejection on every web start. The in-app theme
// is driven by `useThemeColors`, not by this call, so skipping it costs the
// web build nothing.
function applyColorScheme(mode: ThemeMode) {
  Appearance.setColorScheme?.(mode === 'system' ? 'unspecified' : mode);
}

type SettingsState = AppSettings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setColorTheme: (colorTheme: ColorTheme) => Promise<void>;
  setUiStyle: (uiStyle: UiStyle) => Promise<void>;
  setHighContrast: (highContrast: boolean) => Promise<void>;
  setLanguage: (language: LanguageSetting) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setDeutschlandticket: (deutschlandticket: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Every setter persists the whole settings object, so adding a setting
  // can't silently drop the others from storage.
  const update = async (patch: Partial<AppSettings>) => {
    set(patch);
    const { themeMode, colorTheme, uiStyle, highContrast, language, onboarded, deutschlandticket } =
      get();
    await saveSettings({
      themeMode,
      colorTheme,
      uiStyle,
      highContrast,
      language,
      onboarded,
      deutschlandticket,
    });
  };

  return {
    themeMode: 'system',
    colorTheme: 'indigo',
    uiStyle: 'classic',
    highContrast: false,
    language: 'system',
    onboarded: false,
    deutschlandticket: false,
    hydrated: false,

    hydrate: async () => {
      try {
        const settings = await getSettings();
        set({ ...settings });
        applyColorScheme(settings.themeMode);
      } finally {
        set({ hydrated: true });
      }
    },

    setThemeMode: async (themeMode) => {
      applyColorScheme(themeMode);
      await update({ themeMode });
    },

    setColorTheme: (colorTheme) => update({ colorTheme }),

    setUiStyle: (uiStyle) => update({ uiStyle }),

    setHighContrast: (highContrast) => update({ highContrast }),

    setLanguage: (language) => update({ language }),

    completeOnboarding: () => update({ onboarded: true }),

    setDeutschlandticket: (deutschlandticket) => update({ deutschlandticket }),
  };
});
