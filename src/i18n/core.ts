// Minimal i18n: two languages, nested dictionaries, {param} interpolation and plural forms.
// No Intl dependency (Hermes builds don't guarantee locale data).
import { getLocales } from 'expo-localization';

export type Lang = 'uk' | 'en';
export const LANGS: { id: Lang; label: string; native: string; flag: string }[] = [
  { id: 'uk', label: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  { id: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
];

// Plural entry: Ukrainian uses one/few/many, English one/other. `count` param picks the form.
export type Plural = { one: string; few?: string; many?: string; other?: string };

let current: Lang = deviceLang();

export function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'uk' ? 'uk' : 'en';
  } catch {
    return 'uk';
  }
}

// Set by the store provider on every render, before children render, so plain functions
// (formatters, selectors) see the same language as components.
export const setLang = (lang: Lang) => {
  current = lang;
};
export const getLang = () => current;

export function pluralForm(n: number, lang: Lang = current): keyof Plural {
  if (lang === 'en') return n === 1 ? 'one' : 'other';
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'one';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'few';
  return 'many';
}

export function pickPlural(p: Plural, n: number, lang: Lang = current): string {
  const form = pluralForm(n, lang);
  return p[form] ?? p.other ?? p.many ?? p.one;
}

export function interpolate(text: string, params?: Record<string, string | number>) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, key) => (key in params ? String(params[key]) : m));
}

// Picks the variant for the current language from an inline pair: tr({ uk: 'Привіт', en: 'Hi' }).
export const tr = <T>(pair: { uk: T; en: T }, lang: Lang = current): T => pair[lang];
