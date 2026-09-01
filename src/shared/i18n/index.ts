import { create } from 'zustand';
import type { Lang } from '@/shared/api/types';
import ar from './ar.json';
import en from './en.json';

const dictionaries: Record<Lang, unknown> = { ar, en };

export const dirOf = (lang: Lang): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr');

// dir and lang are switched together on <html>, never per-component (spec §3).
// Language lives in the store, not the URL alone, so switching preserves
// state: timeline position, form contents, scroll.
interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  lang: 'ar',
  setLang: (lang) => set({ lang }),
  toggle: () => get().setLang(get().lang === 'ar' ? 'en' : 'ar'),
}));

export function translate(lang: Lang, key: string): string {
  let node: unknown = dictionaries[lang];
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : key;
}

export function useI18n() {
  const lang = useI18nStore((s) => s.lang);
  const setLang = useI18nStore((s) => s.setLang);
  const toggle = useI18nStore((s) => s.toggle);
  return {
    lang,
    dir: dirOf(lang),
    setLang,
    toggle,
    t: (key: string) => translate(lang, key),
  };
}
