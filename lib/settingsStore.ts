import { Appearance } from 'react-native';
import { create } from 'zustand';
import { getSettings, saveSettings } from './storage';
import type { AppSettings, ThemeMode } from '@/types';

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
};

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'system',
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
    set({ themeMode });
    applyColorScheme(themeMode);
    await saveSettings({ themeMode });
  },
}));
