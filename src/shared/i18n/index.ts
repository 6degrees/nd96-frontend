import {create} from 'zustand';
import type {Lang} from '@/shared/api/types';
import ar from './ar.json';
import en from './en.json';

/*
|--------------------------------------------------------------------------
| Dictionaries
|--------------------------------------------------------------------------
*/

const dictionaries: Record<Lang, unknown> = {
    ar,
    en,
};

/*
|--------------------------------------------------------------------------
| Direction
|--------------------------------------------------------------------------
*/

export const dirOf = (lang: Lang): 'rtl' | 'ltr' =>
    lang === 'ar' ? 'rtl' : 'ltr';

/*
|--------------------------------------------------------------------------
| I18n Store
|--------------------------------------------------------------------------
|
| Language and direction are switched together on <html>.
| Keeping the language in the store preserves the current application state.
|
*/

interface I18nState {
    lang: Lang;
    setLang: (lang: Lang) => void;
    toggle: () => void;
}

export const useI18nStore = create<I18nState>((set, get) => ({
    lang: 'ar',

    setLang: (lang) => set({lang}),

    toggle: () =>
        get().setLang(
            get().lang === 'ar' ? 'en' : 'ar'
        ),
}));

/*
|--------------------------------------------------------------------------
| Translation
|--------------------------------------------------------------------------
*/

export function translate(lang: Lang, key: string): string {
    let node: unknown = dictionaries[lang];

    for (const part of key.split('.')) {
        if (typeof node !== 'object' || node === null) {
            return key;
        }

        node = (node as Record<string, unknown>)[part];
    }

    return typeof node === 'string' ? node : key;
}

/*
|--------------------------------------------------------------------------
| I18n Hook
|--------------------------------------------------------------------------
*/

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

