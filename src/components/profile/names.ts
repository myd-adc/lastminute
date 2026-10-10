import type { User } from '@/data/types';
import { getLang, type Lang } from '@/i18n/core';
import { t } from '@/i18n/translate';
import type { Palette, Scheme } from '@/theme';

// Ukrainian instrumental case («з ким?») for first names: Даринка → Даринкою, Остап → Остапом, Юля → Юлею.
// Covers the regular patterns of the mock names; anything unusual falls back to «цією людиною».
// In English the name is used as is («Keep in touch with Darynka?»).
const EXCEPTIONS: Record<string, string> = {
  Ігор: 'Ігорем',
  Лев: 'Левом',
  Любов: 'Любовʼю',
};

export function instrumental(name: string | undefined, lang: Lang = getLang()): string {
  const n = name?.trim();
  const fallback = t('profile.thisPersonWith', undefined, lang);
  if (!n) return fallback;
  if (lang !== 'uk') return n;
  if (EXCEPTIONS[n]) return EXCEPTIONS[n];
  const last = n.slice(-1);
  const stem = n.slice(0, -1);
  if (last === 'а') return /[жчшщ]$/.test(stem) ? `${stem}ею` : `${stem}ою`; // Даринка→Даринкою, Ірина→Іриною
  if (last === 'я') return /[аеєиіїоуюяʼ']$/.test(stem) ? `${stem}єю` : `${stem}ею`; // Юля→Юлею, Софія→Софією
  if (last === 'й') return `${stem}єм`; // Андрій→Андрієм, Сергій→Сергієм
  if (last === 'ь') return `${stem}ем`; // Василь→Василем
  if (/[жчшщ]$/.test(n)) return `${n}ем`;
  if (/[бвгґдзклмнпрстфхц]$/i.test(n)) return `${n}ом`; // Остап→Остапом, Назар→Назаром
  if (last === 'о') return `${stem}ом`; // Марко→Марком
  return fallback;
}

// «він/вона, його/її» (uk) or «she/he, her/him, hers/his» (en) for M15/M17 copy; params for t().
export function pronouns(user: Pick<User, 'gender'> | undefined, lang: Lang = getLang()) {
  const g = user?.gender === 'f' ? 'f' : user?.gender === 'm' ? 'm' : 'x';
  return {
    he: t(`profile.pronouns.${g}.he`, undefined, lang),
    He: t(`profile.pronouns.${g}.He`, undefined, lang),
    him: t(`profile.pronouns.${g}.him`, undefined, lang),
    theirs: t(`profile.pronouns.${g}.theirs`, undefined, lang),
  };
}

// Accent text has to stay readable on the light background: Figma uses a deep olive there.
export const accentText = (c: Palette, scheme: Scheme) => (scheme === 'light' ? '#5A7A00' : c.accent);

// «+380 67 ••• 45 67» from the stored phone digits.
export function maskPhone(phone: string | null): string {
  if (!phone) return t('profile.phoneNotSet');
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('380') ? digits.slice(3) : digits.replace(/^0/, '');
  if (local.length < 9) return phone;
  return `+380 ${local.slice(0, 2)} ••• ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}

// «Open mic: стендап для своїх» → «Open mic».
export const shortTitle = (title: string) => title.split(':')[0].trim();
