import type { Event, User } from '@/data/types';
import { getLang } from '@/i18n/core';
import { t } from '@/i18n/translate';
import { isPast, type ChatSummary } from '@/lib/selectors';
import { dayDiff, dayLabel } from '@/lib/time';
import type { Palette, Scheme } from '@/theme';

// «Open mic: стендап для своїх» → «Open mic» (the part before the colon), used in chat headers and rows.
export const eventShort = (e: Event) => e.title.split(':')[0].trim();

// Lime text is unreadable on light surfaces: Figma uses the ink colour there and keeps lime only as a fill.
export const accentInk = (c: Palette, scheme: Scheme) => (scheme === 'light' ? c.text : c.accent);

// Sender names in group bubbles (M08b): lime on dark, dark olive on light.
export const senderInk = (c: Palette, scheme: Scheme) => (scheme === 'light' ? '#5A7A00' : c.accent);

// Gender key for she/he phrases in the `chat.contact.*` dictionaries.
export const genderKey = (u: User | undefined): 'f' | 'm' => (u?.gender === 'm' ? 'm' : 'f');

// «Самі на Open mic» / «Solo at Open mic» — the solo group's display name.
export const groupName = (e: Event) => t('chat.groupName', { event: eventShort(e) });

// Day word inside a sentence: «зникне завтра о…», «gone tomorrow at…» (English keeps weekday capitals).
export function dayInline(iso: string, now: number) {
  const label = dayLabel(iso, now);
  return getLang() === 'uk' || Math.abs(dayDiff(iso, now)) <= 1 ? label.toLowerCase() : label;
}

// Name as the object of «не втратити …»: Ukrainian accusative, plain name in English.
export const nameObject = (name: string) => (getLang() === 'uk' ? accusative(name) : name);

// Ukrainian grammar table — accusative case for the demo names: «не втратити Даринку / Юлю / Остапа / Марка / Андрія».
export function accusative(name: string) {
  if (/а$/.test(name)) return name.slice(0, -1) + 'у';
  if (/я$/.test(name)) return name.slice(0, -1) + 'ю';
  if (/о$/.test(name)) return name.slice(0, -1) + 'а';
  if (/й$/.test(name)) return name.slice(0, -1) + 'я';
  if (/[бвгґджзклмнпрстфхцчшщ]$/i.test(name)) return name + 'а';
  return name;
}

// Chat list sections: one «Сьогодні · Open mic · Бар «Кульбаба»» group per upcoming event, then past events.
export function chatSections(list: ChatSummary[], now: number) {
  const upcoming: { event: Event; chats: ChatSummary[] }[] = [];
  const past: ChatSummary[] = [];
  for (const chat of list) {
    if (isPast(chat.event, now)) {
      past.push(chat);
      continue;
    }
    const group = upcoming.find((g) => g.event.id === chat.event.id);
    if (group) group.chats.push(chat);
    else upcoming.push({ event: chat.event, chats: [chat] });
  }
  upcoming.sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  return { upcoming, past };
}

export function matchesQuery(chat: ChatSummary, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [chat.user?.name ?? groupName(chat.event), chat.event.title, chat.event.venue].join(' ').toLowerCase();
  return hay.includes(q);
}
