import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

import type { Event } from '@/data/types';
import { t } from '@/i18n/translate';
import { whenLabel } from '@/lib/time';

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

const eventUrl = (e: Event) =>
  Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/event/${e.id}` : Linking.createURL(`/event/${e.id}`);

// Share button: native share sheet; on web the Web Share API when present, otherwise copy the link.
export async function shareEvent(e: Event, now: number): Promise<ShareResult> {
  const url = eventUrl(e);
  const text = t('feed.shareText', { title: e.title, when: whenLabel(e.startsAt, now), venue: e.venue });
  try {
    if (Platform.OS !== 'web') {
      const r = await Share.share({ title: e.title, message: `${text}\n${url}`, url });
      return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
    }
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title: e.title, text, url });
      return 'shared';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return 'copied';
    }
    return 'failed';
  } catch (err) {
    return (err as { name?: string })?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

export function eventIcs(e: Event) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LastMinute//UA',
    'BEGIN:VEVENT',
    `UID:${e.id}@lastminute`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(e.startsAt)}`,
    `DTEND:${icsDate(e.endsAt)}`,
    `SUMMARY:${icsText(e.title)}`,
    `LOCATION:${icsText(`${e.venue}, ${e.address}`)}`,
    `DESCRIPTION:${icsText(e.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// «Add to calendar»: web downloads an .ics file, native hands the .ics text to the share sheet.
export async function addToCalendar(e: Event): Promise<ShareResult> {
  const ics = eventIcs(e);
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${e.id}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      return 'shared';
    }
    const r = await Share.share({ title: `${e.title}.ics`, message: ics });
    return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}
