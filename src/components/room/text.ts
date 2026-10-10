// Small text helpers for the room / match / solo-group screens. Ukrainian grammar (cases, gendered verbs) lives in the
// `uk` branches; English uses the plain localized names.
import type { Event, User } from '@/data/types';
import { getLang } from '@/i18n/core';
import { t } from '@/i18n/translate';

// «Open mic: стендап для своїх» → «Open mic»
export const shortTitle = (e: Event) => e.title.split(':')[0].trim();

// «Бар «Кульбаба»» → «Кульбаба» (with quotes); venues without a quoted name stay as they are.
export function venueShort(venue: string) {
  const i = venue.indexOf('«');
  return i > 0 ? venue.slice(i) : venue;
}

// Locative phrase for «… на Open mic у «Кульбабі»» / «Ти вже була в «Кульбабі»?»; English: «at Kulbaba bar».
const VENUE_IN: Record<string, string> = {
  'Бар «Кульбаба»': 'у «Кульбабі»',
  'Студія «Ритм»': 'у студії «Ритм»',
  Picasso: 'у Picasso',
  'Підвал «Дзиґа»': 'у «Дзизі»',
  'Антикафе «Кабінет»': 'в антикафе «Кабінет»',
  'Дах «Фабрики»': 'на даху «Фабрики»',
  'Площа Ринок': 'на площі Ринок',
};
export function venueIn(venue: string) {
  if (getLang() !== 'uk') return `at ${venue}`;
  if (VENUE_IN[venue]) return VENUE_IN[venue];
  if (venue.startsWith('УКУ')) return 'в УКУ';
  return venue.includes('«') ? `у ${venue}` : `у «${venue}»`;
}

// Dative case for the mock names («Написати Даринці»). Unknown names return null → caller falls back.
const DATIVE: Record<string, string> = {
  Даринка: 'Даринці',
  Остап: 'Остапу',
  Юля: 'Юлі',
  Марко: 'Маркові',
  Катя: 'Каті',
  Андрій: 'Андрію',
  Софія: 'Софії',
  Назар: 'Назару',
  Ірина: 'Ірині',
  Тарас: 'Тарасу',
};
export const dative = (name: string): string | null => DATIVE[name.trim()] ?? null;
// «Написати Даринці» / «Message Darynka»
export const writeTo = (name: string) => {
  if (getLang() !== 'uk') return t('room.match.writeTo', { name });
  const d = dative(name);
  return d ? t('room.match.writeTo', { name: d }) : t('common.write');
};

export const byGender = <T extends string>(u: Pick<User, 'gender'>, f: T, m: T): T => (u.gender === 'f' ? f : m);
export const soloLabel = (u: User) => t(byGender(u, 'room.card.soloF', 'room.card.soloM'));
