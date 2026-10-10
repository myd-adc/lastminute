// Dates, countdowns and counters in the current UI language (see src/i18n). Hand-rolled: Intl locale data is not
// guaranteed under Hermes. Function names are historical — they are no longer Ukrainian-only.
import { t } from '@/i18n/translate';

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

const list = (key: 'weekdayShort' | 'weekdayTitle' | 'weekdayLong' | 'months') => t(`common.time.${key}`).split(',');
const pad = (n: number) => String(n).padStart(2, '0');

// Local date `dayOffset` days from `base`, at hh:mm.
export function at(base: number, dayOffset: number, hh: number, mm = 0): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const dayDiff = (iso: string, now: number) => Math.round((startOfDay(Date.parse(iso)) - startOfDay(now)) / DAY);

export const time = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const weekdayShort = (iso: string) => list('weekdayShort')[new Date(iso).getDay()];
export const weekdayTitle = (iso: string) => list('weekdayTitle')[new Date(iso).getDay()];
export const dayOfMonth = (iso: string) => pad(new Date(iso).getDate());
// «Субота, 10 жовтня» / «Saturday, 10 October»
export const longDate = (iso: string) => {
  const d = new Date(iso);
  return `${list('weekdayLong')[d.getDay()]}, ${d.getDate()} ${list('months')[d.getMonth()]}`;
};

// «Сьогодні» / «Завтра» / «Вчора» / «Пт»
export function dayLabel(iso: string, now: number) {
  const diff = dayDiff(iso, now);
  if (diff === 0) return t('common.time.today');
  if (diff === 1) return t('common.time.tomorrow');
  if (diff === -1) return t('common.time.yesterday');
  return weekdayTitle(iso);
}

// «Сьогодні · 20:00» on poster pills, «Сьогодні 20:00» in headers.
export const whenLabel = (iso: string, now: number, sep = ' · ') => `${dayLabel(iso, now)}${sep}${time(iso)}`;

// Chat-list style timestamp: «18:06» today, «нд» this week, else «12.10».
export function shortStamp(iso: string, now: number) {
  const diff = dayDiff(iso, now);
  if (diff === 0) return time(iso);
  if (diff > -7) return weekdayTitle(iso).toLowerCase();
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

// «27 год» / «27 h», «40 хв» / «40 min» — compact countdown used on chat timers.
export function countdown(ms: number) {
  const min = Math.max(0, Math.ceil(ms / 60000));
  if (min >= 60) return t('common.time.hoursShort', { n: Math.floor(min / 60) });
  return t('common.time.minutesShort', { n: min });
}

// «23 год 40 хв» / «23 h 40 min»
export function countdownLong(ms: number) {
  const min = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(min / 60);
  return h > 0 ? t('common.time.hoursMinutes', { h, m: min % 60 }) : t('common.time.minutesShort', { n: min % 60 });
}

// Ukrainian plural picker kept for existing callers; prefer plural entries in the dictionaries.
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const going = (n: number) => t('common.count.going', { count: n });
export const people = (n: number) => t('common.count.people', { count: n });
export const eventsCount = (n: number) => t('common.count.events', { count: n });
