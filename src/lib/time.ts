// Ukrainian date/time formatting, hand-rolled: Intl locale data is not guaranteed under Hermes.

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

const WEEKDAY_SHORT = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const WEEKDAY_TITLE = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WEEKDAY_LONG = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

const pad = (n: number) => String(n).padStart(2, '0');

// Local date `dayOffset` days from `base`, at hh:mm.
export function at(base: number, dayOffset: number, hh: number, mm = 0): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const dayDiff = (iso: string, now: number) => Math.round((startOfDay(Date.parse(iso)) - startOfDay(now)) / DAY);

export const time = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const weekdayShort = (iso: string) => WEEKDAY_SHORT[new Date(iso).getDay()];
export const weekdayTitle = (iso: string) => WEEKDAY_TITLE[new Date(iso).getDay()];
export const dayOfMonth = (iso: string) => pad(new Date(iso).getDate());
export const longDate = (iso: string) => {
  const d = new Date(iso);
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

// «Сьогодні» / «Завтра» / «Вчора» / «Пт»
export function dayLabel(iso: string, now: number) {
  const diff = dayDiff(iso, now);
  if (diff === 0) return 'Сьогодні';
  if (diff === 1) return 'Завтра';
  if (diff === -1) return 'Вчора';
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

// «27 год», «40 хв» — compact countdown used on chat timers.
export function countdown(ms: number) {
  const min = Math.max(0, Math.ceil(ms / 60000));
  if (min >= 60) return `${Math.floor(min / 60)} год`;
  return `${min} хв`;
}

// «23 год 40 хв»
export function countdownLong(ms: number) {
  const min = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} год ${min % 60} хв` : `${min % 60} хв`;
}

// Picks the Ukrainian plural form: one (1, 21), few (2–4, 22–24), many (0, 5–20…).
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const going = (n: number) => `${n} ${plural(n, 'йде', 'йдуть', 'йдуть')}`;
export const people = (n: number) => `${n} ${plural(n, 'людина', 'людини', 'людей')}`;
export const eventsCount = (n: number) => `${n} ${plural(n, 'подія', 'події', 'подій')}`;
