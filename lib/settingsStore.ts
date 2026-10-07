import { Appearance } from 'react-native';
import { create } from 'zustand';
import { getSettings, saveSettings } from './storage';
import type { AppSettings, LanguageSetting, ThemeMode } from '@/types';

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
  setLanguage: (language: LanguageSetting) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Every setter persists the whole settings object, so adding a setting
  // can't silently drop the others from storage.
  const update = async (patch: Partial<AppSettings>) => {
    set(patch);
    const { themeMode, language, onboarded } = get();
    await saveSettings({ themeMode, language, onboarded });
  };

  return {
    themeMode: 'system',
    language: 'system',
    onboarded: false,
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

    setLanguage: (language) => update({ language }),

    completeOnboarding: () => update({ onboarded: true }),
  };
});
