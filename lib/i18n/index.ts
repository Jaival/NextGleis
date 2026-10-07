import { useLocales } from 'expo-localization';
import { useMemo } from 'react';
import { useSettingsStore } from '@/lib/settingsStore';
import type { Language } from '@/types';
import { de } from './de';
import { en, type Messages } from './en';

const CATALOGS: Record<Language, Messages> = { en, de };

type Key = keyof Messages;
type Params<K extends Key> = Messages[K] extends (...args: infer A) => string ? A : [];
export type Translate = <K extends Key>(key: K, ...params: Params<K>) => string;

function translator(language: Language): Translate {
  const messages = CATALOGS[language];
  return (key, ...params) => {
    const entry = messages[key] as string | ((...args: unknown[]) => string);
    return typeof entry === 'function' ? entry(...params) : entry;
  };
}

// German on a German-language device, English for everyone else: the app is
// about German transit, and English is the most likely second language of a
// visitor.
export function useLanguage(): Language {
  const setting = useSettingsStore((s) => s.language);
  const [locale] = useLocales();
  if (setting !== 'system') return setting;
  return locale?.languageCode === 'de' ? 'de' : 'en';
}

// `useLocales` re-renders when the device language changes, so the whole UI
// follows a language switch in system settings without a restart.
export function useT(): Translate {
  const language = useLanguage();
  return useMemo(() => translator(language), [language]);
}
