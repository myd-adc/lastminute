// Pure derived data over store state + mock data. Every function takes `now` (demo clock) explicitly.
import { albumPhotos, attendanceOf, attendeesOf, events, getEvent, getUser, PAST_EVENT_IDS, pastChats, soloGroups } from '@/data/mock';
import type { Attendance, Event, Message, Photo, User } from '@/data/types';
import { dmChatId, groupChatId, pairKey, type State } from '@/store/state';

import { DAY } from './time';

export const CHAT_TTL_AFTER_EVENT_MS = DAY; // chats and albums live until event end + 24 h

export type Attendee = { user: User; attendance: Attendance };

// ── Events ──────────────────────────────────────────────────────────────

export const isPast = (e: Event, now: number) => Date.parse(e.endsAt) <= now;
export const isLive = (e: Event, now: number) => Date.parse(e.startsAt) <= now && now < Date.parse(e.endsAt);
export const expiresAt = (e: Event) => Date.parse(e.endsAt) + CHAT_TTL_AFTER_EVENT_MS;

const upcoming = (now: number) =>
  events.filter((e) => !PAST_EVENT_IDS.includes(e.id) && !isPast(e, now)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

export const sceneEvents = (state: State, now: number) => upcoming(now).filter((e) => e.sceneId === state.sceneId);

// Swipe feed for the current tab: unseen events first; skipped and «Я йду» ones drop out of the stack.
export function feedEvents(state: State, now: number): Event[] {
  const base =
    state.feedTab === 'saved'
      ? upcoming(now).filter((e) => state.saved[e.id])
      : state.feedTab === 'city'
        ? upcoming(now)
        : sceneEvents(state, now);
  return base.filter((e) => !state.skipped[e.id] && !state.going[e.id]);
}

export const myUpcoming = (state: State, now: number) => upcoming(now).filter((e) => state.going[e.id]);
export const nextOnScene = (state: State, now: number, exceptId?: string) =>
  sceneEvents(state, now).filter((e) => e.id !== exceptId);

// ── People ──────────────────────────────────────────────────────────────

export const goingCount = (state: State, e: Event) => e.goingCount + (state.going[e.id] ? 1 : 0);
export const soloCount = (state: State, e: Event) =>
  e.soloCount + (state.going[e.id]?.with === 'solo' && state.settings.showSolo ? 1 : 0);

export const attendeesFor = (state: State, eventId: string): Attendee[] =>
  attendeesOf(eventId)
    .map((attendance) => ({ attendance, user: getUser(attendance.userId) }))
    .filter((a): a is Attendee => !!a.user && !state.blocked[a.user.id]);

// People the user has met at earlier events («знайомі»).
export const acquaintances = (state: State, eventId: string) =>
  attendeesFor(state, eventId).filter((a) => a.user.sharedEvents > 0);

// Room swipe queue: everyone not decided yet. Index/total power the «3 / 14» pill.
export function roomQueue(state: State, eventId: string) {
  const all = attendeesFor(state, eventId);
  const pending = all.filter((a) => !state.decisions[pairKey(eventId, a.user.id)]);
  return { pending, decided: all.length - pending.length, total: all.length };
}

export const decisionOf = (state: State, eventId: string, userId: string) => state.decisions[pairKey(eventId, userId)]?.choice;

// Match = the user pressed «Піти разом» and the other side already did too.
export const isMatch = (state: State, eventId: string, userId: string) =>
  decisionOf(state, eventId, userId) === 'go' && !!attendanceOf(eventId, userId)?.likesYou && !state.blocked[userId];

// «Очікує»: the user pressed «Піти разом», the other side has not (yet).
export const isWaiting = (state: State, eventId: string, userId: string) =>
  decisionOf(state, eventId, userId) === 'go' && !attendanceOf(eventId, userId)?.likesYou && !state.blocked[userId];

// ── Chats ───────────────────────────────────────────────────────────────

export type ChatSummary = {
  id: string;
  kind: 'dm' | 'group';
  event: Event;
  user?: User; // dm only
  status: 'open' | 'waiting' | 'closed' | 'contact';
  expiresAt: number;
  last?: Message;
  unread: boolean;
  theirContact?: string;
};

export function chatState(state: State, event: Event, userId: string | null, now: number): ChatSummary['status'] {
  const id = userId ? dmChatId(event.id, userId) : groupChatId(event.id);
  if (userId) {
    const mine = state.myContacts[pairKey(event.id, userId)];
    const theirs = attendanceOf(event.id, userId)?.leavesContact;
    if (mine && theirs && isPast(event, now)) return 'contact';
    if (isWaiting(state, event.id, userId)) return 'waiting';
  }
  if (state.closedChats[id] || now >= expiresAt(event)) return 'closed';
  return 'open';
}

// Thread = seeded demo messages (localized, from mock data) + messages written in this session (stored in state).
export function messagesOf(state: State, chatId: string): Message[] {
  const own = state.messages[chatId] ?? [];
  const seeded = chatId.startsWith('group:')
    ? (soloGroups[chatId.slice('group:'.length)]?.messages ?? [])
    : (pastChats.find((c) => dmChatId(c.eventId, c.userId) === chatId)?.messages ?? []);
  if (!seeded.length) return own;
  return [...seeded, ...own].sort((a, b) => a.at.localeCompare(b.at));
}

export function chatList(state: State, now: number): ChatSummary[] {
  const list: ChatSummary[] = [];
  for (const [key, d] of Object.entries(state.decisions)) {
    if (d.choice !== 'go') continue;
    const [eventId, userId] = key.split(':');
    const event = getEvent(eventId);
    const user = getUser(userId);
    if (!event || !user || state.blocked[userId]) continue;
    if (!isMatch(state, eventId, userId) && !isWaiting(state, eventId, userId)) continue;
    const id = dmChatId(eventId, userId);
    const msgs = messagesOf(state, id);
    const last = msgs.at(-1);
    list.push({
      id,
      kind: 'dm',
      event,
      user,
      status: chatState(state, event, userId, now),
      expiresAt: expiresAt(event),
      last,
      unread: !!last && last.from !== 'me' && (!state.lastRead[id] || state.lastRead[id] < last.at),
      theirContact: state.myContacts[key] ? attendanceOf(eventId, userId)?.leavesContact : undefined,
    });
  }
  for (const [eventId, g] of Object.entries(state.going)) {
    const event = getEvent(eventId);
    if (!event || !g.joinSoloGroup || g.with !== 'solo' || !soloGroups[eventId]) continue;
    const id = groupChatId(eventId);
    const last = messagesOf(state, id).at(-1);
    list.push({
      id,
      kind: 'group',
      event,
      status: chatState(state, event, null, now),
      expiresAt: expiresAt(event),
      last,
      unread: !!last && last.from !== 'me' && (!state.lastRead[id] || state.lastRead[id] < last.at),
    });
  }
  return list.sort((a, b) => (b.last?.at ?? '').localeCompare(a.last?.at ?? ''));
}

export const unreadCount = (state: State, now: number) => chatList(state, now).filter((c) => c.unread).length;

// ── Group «Самі на …» ──────────────────────────────────────────────────

export function soloGroupMembers(state: State, eventId: string): User[] {
  return attendeesFor(state, eventId)
    .filter((a) => a.attendance.inSoloGroup)
    .map((a) => a.user);
}

// ── Album ───────────────────────────────────────────────────────────────

export const albumOpen = (e: Event, now: number) => now >= Date.parse(e.startsAt) && now < expiresAt(e);
export const albumFor = (state: State, eventId: string): Photo[] =>
  [...albumPhotos.filter((p) => p.eventId === eventId && !state.blocked[p.authorId]), ...state.photos.filter((p) => p.eventId === eventId)];

// ── After the event ────────────────────────────────────────────────────

// Events the user attended that are over, still within 24 h and not yet rated (M15).
export const pendingSurveys = (state: State, now: number): Event[] =>
  events.filter((e) => state.going[e.id] && isPast(e, now) && now < expiresAt(e) && !state.surveys[e.id]);

export const matchesAt = (state: State, eventId: string): User[] =>
  attendeesFor(state, eventId)
    .filter((a) => isMatch(state, eventId, a.user.id))
    .map((a) => a.user);

// ── Profile stats ───────────────────────────────────────────────────────

export function profileStats(state: State, now: number) {
  const attended = events.filter((e) => state.going[e.id] && isPast(e, now)).length;
  const newPeople = new Set(chatList(state, now).filter((c) => c.kind === 'dm' && c.status !== 'waiting').map((c) => c.user!.id)).size;
  const contacts = chatList(state, now).filter((c) => c.status === 'contact').length;
  return { attended, newPeople, contacts };
}
