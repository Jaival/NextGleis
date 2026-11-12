import { Observe } from 'expo-observe';
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

// The one switch for everything expo-observe sends: error reports and startup
// timings. While off, pending data is dropped, not queued. Observe sends when
// the app goes to the background, so applying the stored value during
// hydration is early enough to honour an opt-out from the previous session.
function applyDiagnostics(enabled: boolean) {
  Observe.configure({ dispatchingEnabled: enabled });
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
  setLocationEnabled: (locationEnabled: boolean) => Promise<void>;
  setDiagnosticsEnabled: (diagnosticsEnabled: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Every setter persists the whole settings object, so adding a setting
  // can't silently drop the others from storage.
  const update = async (patch: Partial<AppSettings>) => {
    set(patch);
    const {
      themeMode,
      colorTheme,
      uiStyle,
      highContrast,
      language,
      onboarded,
      deutschlandticket,
      locationEnabled,
      diagnosticsEnabled,
    } = get();
    await saveSettings({
      themeMode,
      colorTheme,
      uiStyle,
      highContrast,
      language,
      onboarded,
      deutschlandticket,
      locationEnabled,
      diagnosticsEnabled,
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
    locationEnabled: true,
    diagnosticsEnabled: true,
    hydrated: false,

    hydrate: async () => {
      try {
        const settings = await getSettings();
        set({ ...settings });
        applyColorScheme(settings.themeMode);
        applyDiagnostics(settings.diagnosticsEnabled);
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

    setLocationEnabled: (locationEnabled) => update({ locationEnabled }),

    setDiagnosticsEnabled: async (diagnosticsEnabled) => {
      applyDiagnostics(diagnosticsEnabled);
      await update({ diagnosticsEnabled });
    },
  };
});
