// Hand-rolled Ukrainian formatting: Intl locale data is not guaranteed on every Hermes build.

const WEEKDAYS_SHORT = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const WEEKDAYS_SHORT_TITLE = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WEEKDAYS_LONG = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
const MONTHS_GENITIVE = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

const pad = (n: number) => String(n).padStart(2, '0');

export const weekdayShort = (iso: string) => WEEKDAYS_SHORT[new Date(iso).getDay()];
export const dayOfMonth = (iso: string) => pad(new Date(iso).getDate());
export const time = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
// "Субота, 10 жовтня"
export const longDate = (iso: string) => {
  const d = new Date(iso);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`;
};
// "Сб 19:00"
export const shortDayTime = (iso: string) => `${WEEKDAYS_SHORT_TITLE[new Date(iso).getDay()]} ${time(iso)}`;

// Picks the Ukrainian plural form: one (1, 21), few (2–4, 22–24), many (0, 5–20, 25…).
export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const goingLabel = (n: number) => `${n} ${plural(n, 'йде', 'йдуть', 'йдуть')}`;
export const peopleGoingLabel = (n: number) =>
  `${n} ${plural(n, 'людина вже йде', 'людини вже йдуть', 'людей уже йдуть')}`;
export const eventsLabel = (n: number) => `${n} ${plural(n, 'подія', 'події', 'подій')}`;

export function timeLeft(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
}

export const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';
