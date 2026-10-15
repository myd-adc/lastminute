// Pure derived data over store state + mock data. Every function takes `now` (demo clock) explicitly.
import { albumPhotos, attendanceOf, attendeesOf, communities, events, getCommunity, getEvent, getUser, PAST_EVENT_IDS, pastChats, soloGroups } from '@/data/mock';
import type { Attendance, Community, Event, Message, Photo, User } from '@/data/types';
import { dmChatId, groupChatId, pairKey, type State } from '@/store/state';
import type { GradientId } from '@/theme/palette';

import { ageForSure, DAY } from './time';

export const CHAT_TTL_AFTER_EVENT_MS = DAY; // chats and albums live until event end + 24 h

export type Attendee = { user: User; attendance: Attendance };

// ── Events ──────────────────────────────────────────────────────────────

export const isPast = (e: Event, now: number) => Date.parse(e.endsAt) <= now;
export const isLive = (e: Event, now: number) => Date.parse(e.startsAt) <= now && now < Date.parse(e.endsAt);
export const expiresAt = (e: Event) => Date.parse(e.endsAt) + CHAT_TTL_AFTER_EVENT_MS;

// ── Communities ─────────────────────────────────────────────────────────

export const isMember = (state: State, communityId: string) => !!state.memberships[communityId];
export const myCommunities = (state: State): Community[] => communities.filter((c) => isMember(state, c.id));
// The "UCU ✓" pill next to the user's name: the first community they joined with a confirmed address.
export const verifiedCommunity = (state: State): Community | undefined => myCommunities(state).find((c) => !!c.emailDomain);
export const discoverCommunities = (state: State): Community[] => communities.filter((c) => !isMember(state, c.id));
// City events and open communities are for everyone; a domain-only community's events only for its members.
export const canSee = (state: State, e: Event) => {
  if (!e.communityId) return true;
  const c = getCommunity(e.communityId);
  return !c || !c.emailDomain || isMember(state, c.id);
};

const upcoming = (state: State, now: number) =>
  events
    .filter((e) => !PAST_EVENT_IDS.includes(e.id) && !isPast(e, now) && canSee(state, e))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

export const communityEvents = (state: State, now: number, communityId: string) =>
  upcoming(state, now).filter((e) => e.communityId === communityId);

// People the user already matched with (any event). Live: the server counts them per event instead.
function friendIds(state: State): Set<string> {
  const ids = new Set<string>();
  for (const [key, d] of Object.entries(state.decisions)) {
    const [eventId, userId] = key.split(':');
    if (d.choice === 'go' && attendanceOf(eventId, userId)?.likesYou && !state.blocked[userId]) ids.add(userId);
  }
  return ids;
}

// "Met": how many people you met before are going. A count only, never who (symmetry).
export function metCount(state: State, e: Event, friends = friendIds(state)): number {
  if (e.metCount !== undefined) return e.metCount;
  return attendeesOf(e.id).filter((a) => friends.has(a.userId)).length;
}

// "For you" ranking: events matching the user's interests first, then by time.
const byInterest = (state: State) => (a: Event, b: Event) =>
  Number(state.interests.includes(b.category)) - Number(state.interests.includes(a.category)) || a.startsAt.localeCompare(b.startsAt);

// Events with an age limit stay out of the feed until the user is certainly old enough. Without a year of birth
// (accounts made before M04b) nothing is hidden.
function oldEnough(state: State, e: Event, now: number) {
  if (!e.ageLimit) return true;
  const year = state.me?.birthYear;
  return year === undefined || ageForSure(year, now) >= e.ageLimit;
}

export function tabEvents(state: State, now: number, tab: State['feedTab']): Event[] {
  const all = upcoming(state, now).filter((e) => oldEnough(state, e, now));
  if (tab === 'saved') return all.filter((e) => state.saved[e.id]);
  if (tab === 'communities') return all.filter((e) => e.communityId && isMember(state, e.communityId));
  if (tab === 'met') {
    const friends = friendIds(state);
    return all.filter((e) => metCount(state, e, friends) > 0);
  }
  return [...all].sort(byInterest(state));
}

// Swipe feed for the current tab: skipped and "I'm going" ones drop out of the stack. Saved ones stay saved even if
// skipped later, so the saved stack ignores skips.
export const feedEvents = (state: State, now: number): Event[] =>
  tabEvents(state, now, state.feedTab).filter((e) => (state.feedTab === 'saved' || !state.skipped[e.id]) && !state.going[e.id]);

export const myUpcoming = (state: State, now: number) => upcoming(state, now).filter((e) => state.going[e.id]);
export const nextForYou = (state: State, now: number, exceptId?: string) =>
  tabEvents(state, now, 'forYou').filter((e) => e.id !== exceptId && !state.going[e.id]);

// Personal events carry the person who made them; a community or city event carries nobody.
export function eventAuthor(state: State, e: Event): { name: string; gradient: GradientId; photoUri?: string } | null {
  if (!e.authorId) return null;
  if (e.authorId === 'me') return state.me ? { name: state.me.name, gradient: state.me.gradient, photoUri: state.me.photoUri } : null;
  const u = getUser(e.authorId);
  return u ? { name: u.name, gradient: u.gradient, photoUri: u.photoUri } : null;
}

export const isMyEvent = (state: State, e: Event) => e.authorId === 'me';

// Upcoming personal events the user is running right now — the cap keeps one person from filling the feed.
export const MAX_OWN_EVENTS = 3;
export const myOwnEvents = (state: State, now: number) => upcoming(state, now).filter((e) => isMyEvent(state, e));

// ── People ──────────────────────────────────────────────────────────────

export const goingCount = (state: State, e: Event) => e.goingCount + (state.going[e.id] ? 1 : 0);
export const soloCount = (state: State, e: Event) =>
  e.soloCount + (state.going[e.id]?.with === 'solo' && state.settings.showSolo ? 1 : 0);

export const attendeesFor = (state: State, eventId: string): Attendee[] =>
  attendeesOf(eventId)
    .map((attendance) => ({ attendance, user: getUser(attendance.userId) }))
    .filter((a): a is Attendee => !!a.user && !state.blocked[a.user.id]);

// People the user has met at earlier events ("Met").
export const acquaintances = (state: State, eventId: string) =>
  attendeesFor(state, eventId).filter((a) => a.user.sharedEvents > 0);

// Room swipe queue: everyone not decided yet. Index/total power the «3 / 14» pill.
export function roomQueue(state: State, eventId: string) {
  const all = attendeesFor(state, eventId);
  const pending = all.filter((a) => !state.decisions[pairKey(eventId, a.user.id)]);
  return { pending, decided: all.length - pending.length, total: all.length };
}

// "Darynka, 20"; live profiles have no age yet, so just the name.
export const nameAge = (u: User) => (u.age ? `${u.name}, ${u.age}` : u.name);

export const decisionOf = (state: State, eventId: string, userId: string) => state.decisions[pairKey(eventId, userId)]?.choice;

// Match = the user pressed "Go together" and the other side already did too.
export const isMatch = (state: State, eventId: string, userId: string) =>
  decisionOf(state, eventId, userId) === 'go' && !!attendanceOf(eventId, userId)?.likesYou && !state.blocked[userId];

// "Pending": the user pressed "Go together", the other side has not (yet).
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

// Thread = seeded demo messages (localized, from mock data), then messages written in this session (stored in state)
// in the order they were sent. Not re-sorted by time: a seeded timestamp must never push new messages above it.
export function messagesOf(state: State, chatId: string): Message[] {
  const own = state.messages[chatId] ?? [];
  const seeded = chatId.startsWith('group:')
    ? (soloGroups[chatId.slice('group:'.length)]?.messages ?? [])
    : (pastChats.find((c) => dmChatId(c.eventId, c.userId) === chatId)?.messages ?? []);
  return seeded.length ? [...seeded, ...own] : own;
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

// ── Group "Solo at …" ──────────────────────────────────────────────────

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
