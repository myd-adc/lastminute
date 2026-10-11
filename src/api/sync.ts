import { AppState } from 'react-native';

import type { RemoteData } from '@/data/mock';
import type { Attendance, Event, InterestId, Message, SceneId, User } from '@/data/types';
import { DAY } from '@/lib/time';
import { dmChatId, pairKey, type Going, type State } from '@/store/state';
import type { GradientId } from '@/theme/palette';

import { supabase, type Tables } from './client';

// Server-owned slices of the store, replaced wholesale on every sync.
export type Synced = Pick<State, 'going' | 'decisions' | 'messages' | 'closedChats' | 'blocked'> & { syncedAt: string };
export type Snapshot = { remote: RemoteData; synced: Synced };

const HISTORY_MS = 30 * DAY; // past events kept for chats, «Минулі події» and shared-event counts
const iso = (s: string) => new Date(s).toISOString(); // one timestamp format, so string comparisons stay valid

// chatId → match id, for writing messages and closing chats.
const matchByChat = new Map<string, string>();
// Everyone seen so far stays resolvable by id (e.g. names in «Заблоковані» after RLS hides them).
const knownUsers = new Map<string, User>();

const must = <T>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

function toEvent(e: Tables<'events'>, going: number, solo: number): RemoteData['events'][number] {
  const poster = e.poster as Partial<Event['poster']> | null;
  return {
    id: e.id,
    sceneId: e.scene_id as SceneId,
    title: { uk: e.title_uk, en: e.title_en },
    description: { uk: e.description_uk, en: e.description_en },
    poster: {
      lines: poster?.lines?.length ? poster.lines : e.title_uk.split(' ').slice(0, 2),
      emoji: poster?.emoji ?? '',
      gradient: (poster?.gradient ?? 'aurora') as GradientId,
    },
    startsAt: iso(e.starts_at),
    endsAt: iso(e.ends_at),
    venue: e.venue,
    address: e.address,
    walk: e.walk ?? undefined,
    price: e.price,
    priceNote: e.price_note ?? undefined,
    category: e.category as InterestId,
    ageLimit: e.age_limit ?? undefined,
    partner: e.partner,
    goingCount: going,
    soloCount: solo,
  };
}

export async function fetchSnapshot(me: string): Promise<Snapshot> {
  const since = new Date(Date.now() - HISTORY_MS).toISOString();
  const [scenes, sceneStats, eventRows, attendances, profiles, decisions, matches, messages, blocks] = await Promise.all([
    supabase.from('scenes').select('*').then(must),
    supabase.rpc('scene_stats').then(must),
    supabase.from('events').select('*').gt('ends_at', since).order('starts_at').then(must),
    supabase.from('attendances').select('*').then(must),
    supabase.from('profiles').select('*').then(must),
    supabase.from('decisions').select('*').eq('from_user', me).then(must),
    supabase.from('matches').select('*').then(must),
    supabase.from('messages').select('*').order('created_at').then(must),
    supabase.from('blocks').select('*').eq('blocker', me).then(must),
  ]);
  const stats = must(await supabase.rpc('events_stats', { p_events: eventRows.map((e) => e.id) }));

  const now = Date.now();
  const mine = attendances.filter((a) => a.user_id === me);
  const myEventIds = new Set(mine.map((a) => a.event_id));
  const meProfile = profiles.find((p) => p.id === me);
  const pastIds = new Set(eventRows.filter((e) => Date.parse(e.ends_at) <= now).map((e) => e.id));

  // Counters exclude the user: the selectors add their own «Я йду» on top, as in the demo.
  const events = eventRows.map((e) => {
    const s = stats.find((x) => x.event_id === e.id);
    const myRow = mine.find((a) => a.event_id === e.id);
    const meSolo = myRow?.going_with === 'solo' && meProfile?.show_solo !== false;
    return toEvent(e, Math.max(0, (s?.going ?? 0) - (myRow ? 1 : 0)), Math.max(0, (s?.solo ?? 0) - (meSolo ? 1 : 0)));
  });

  const blocked: Synced['blocked'] = {};
  for (const b of blocks) blocked[b.blocked] = true;

  const matchSet = new Set<string>();
  const closedChats: Synced['closedChats'] = {};
  matchByChat.clear();
  for (const m of matches) {
    const other = m.user_a === me ? m.user_b : m.user_a;
    const chatId = dmChatId(m.event_id, other);
    matchSet.add(pairKey(m.event_id, other));
    matchByChat.set(chatId, m.id);
    if (m.closed_by) closedChats[chatId] = true;
  }

  for (const p of profiles) {
    if (p.id === me) continue;
    const shared = attendances.filter((a) => a.user_id === p.id && pastIds.has(a.event_id) && myEventIds.has(a.event_id)).length;
    knownUsers.set(p.id, {
      id: p.id,
      name: p.name,
      gender: (p.gender as User['gender']) ?? undefined,
      sceneId: (p.scene_id ?? 'guest') as SceneId,
      affiliation: p.affiliation,
      talkAbout: p.talk_about,
      tags: p.interests as InterestId[],
      gradient: p.gradient as GradientId,
      sharedEvents: p.show_shared ? shared : 0,
    });
  }

  const showSolo = new Map(profiles.map((p) => [p.id, p.show_solo]));
  const others: Attendance[] = attendances
    .filter((a) => a.user_id !== me && knownUsers.has(a.user_id))
    .map((a) => {
      const solo = a.going_with === 'solo' && showSolo.get(a.user_id) !== false;
      return {
        eventId: a.event_id,
        userId: a.user_id,
        solo,
        inSoloGroup: solo && a.join_solo_group,
        // Only a mutual «Піти разом» is ever visible: a one-sided one stays hidden (consent).
        likesYou: matchSet.has(pairKey(a.event_id, a.user_id)),
      };
    });

  const going: Synced['going'] = {};
  for (const a of mine) going[a.event_id] = { at: iso(a.created_at), with: a.going_with, joinSoloGroup: a.join_solo_group };

  const myDecisions: Synced['decisions'] = {};
  for (const d of decisions) myDecisions[pairKey(d.event_id, d.to_user)] = { choice: d.choice, at: iso(d.created_at) };

  const chatOf = new Map([...matchByChat].map(([chat, id]) => [id, chat]));
  const threads: Synced['messages'] = {};
  for (const m of messages) {
    const chatId = chatOf.get(m.match_id);
    if (!chatId) continue;
    const msg: Message = { id: m.id, from: m.sender_id === me ? 'me' : m.sender_id, text: m.text, at: iso(m.created_at) };
    (threads[chatId] ??= []).push(msg);
  }

  const members = new Map(sceneStats.map((s) => [s.scene_id, s.members]));
  return {
    remote: {
      scenes: scenes.map((s) => ({
        id: s.id as SceneId,
        name: { uk: s.name_uk, en: s.name_en },
        description: { uk: s.description_uk, en: s.description_en },
        kind: s.kind,
        gradient: s.gradient as GradientId,
        people: members.get(s.id) ?? 0,
        requiresStudentEmail: !!s.email_domain,
      })),
      events,
      users: [...knownUsers.values()],
      attendances: others,
    },
    synced: { going, decisions: myDecisions, messages: threads, closedChats, blocked, syncedAt: new Date().toISOString() },
  };
}

// ── Writes (RLS on the server is the source of truth; a failed write is undone by the next sync) ──

const ok = ({ error }: { error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
};
const write = async (q: PromiseLike<{ error: { message: string } | null }>) => ok(await q);

export const markGoing = (me: string, eventId: string, g: Going) =>
  write(supabase.from('attendances').upsert({ event_id: eventId, user_id: me, going_with: g.with, join_solo_group: g.joinSoloGroup }));

export const leaveEvent = (me: string, eventId: string) =>
  write(supabase.from('attendances').delete().eq('event_id', eventId).eq('user_id', me));

// Returns whether the choice completed a match (the server trigger creates it).
export async function decide(me: string, eventId: string, userId: string, choice: 'go' | 'skip'): Promise<boolean> {
  ok(await supabase.from('decisions').upsert({ event_id: eventId, from_user: me, to_user: userId, choice }));
  if (choice !== 'go') return false;
  const [a, b] = me < userId ? [me, userId] : [userId, me];
  const { data } = await supabase.from('matches').select('id').eq('event_id', eventId).eq('user_a', a).eq('user_b', b).maybeSingle();
  return !!data;
}

export async function sendMessage(me: string, chatId: string, text: string) {
  const matchId = matchByChat.get(chatId);
  if (!matchId) throw new Error('no_match');
  ok(await supabase.from('messages').insert({ match_id: matchId, sender_id: me, text }));
}

export async function closeChat(me: string, chatId: string) {
  const matchId = matchByChat.get(chatId);
  if (matchId) ok(await supabase.from('matches').update({ closed_by: me }).eq('id', matchId));
}

export const block = (me: string, userId: string) =>
  write(supabase.from('blocks').upsert({ blocker: me, blocked: userId }, { ignoreDuplicates: true }));

export const unblock = (me: string, userId: string) =>
  write(supabase.from('blocks').delete().eq('blocker', me).eq('blocked', userId));

export const report = (me: string, r: State['reports'][number]) =>
  write(supabase.from('reports').insert({ reporter: me, reported: r.userId, event_id: r.eventId ?? null, reason: r.reason }));

// ── Live updates ───────────────────────────────────────────────────────

type SyncHandlers = { onSnapshot: (s: Snapshot) => void; onSignedOut: () => void; onError?: (e: unknown) => void };

const POLL_MS = 60_000;

// Keeps the store in step with the server: initial fetch, realtime pushes, foreground and a slow poll as a safety net.
// Returns a resync trigger and a stop function.
export function startSync(me: string, h: SyncHandlers) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | null = null;
  let again = false;

  const run = (): Promise<void> => {
    if (running) {
      again = true;
      return running;
    }
    running = fetchSnapshot(me)
      .then((s) => {
        if (!stopped) h.onSnapshot(s);
      })
      .catch((e) => h.onError?.(e))
      .finally(() => {
        running = null;
        if (again && !stopped) {
          again = false;
          void run();
        }
      });
    return running;
  };
  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(run, 250);
  };

  // A unique topic: supabase.channel() would hand back a previous, still-closing channel with the same name.
  const channel = supabase
    .channel(`sync:${me}:${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, soon)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, soon)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendances' }, soon)
    .subscribe((status, err) => {
      if (status !== 'SUBSCRIBED' && status !== 'CLOSED') h.onError?.(err ?? new Error(`realtime ${status}`));
    });
  const poll = setInterval(run, POLL_MS);
  const appState = AppState.addEventListener('change', (s) => s === 'active' && run());
  const auth = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !stopped) h.onSignedOut();
  });
  void run();

  return {
    resync: run,
    stop: () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(poll);
      appState.remove();
      auth.data.subscription.unsubscribe();
      void supabase.removeChannel(channel);
      matchByChat.clear();
      knownUsers.clear();
    },
  };
}
