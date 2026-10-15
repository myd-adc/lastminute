import { AppState } from 'react-native';

import type { RemoteData } from '@/data/mock';
import type { Attendance, Community, Event, InterestId, Message, User } from '@/data/types';
import { DAY } from '@/lib/time';
import { dmChatId, pairKey, type Going, type State } from '@/store/state';
import type { GradientId } from '@/theme/palette';

import { supabase, type Tables } from './client';
import { AVATARS, avatarUploads, COVERS, isPicked, publicUrl, removeImage, signedUrls, uploadImage } from './storage';

// Server-owned slices of the store, replaced wholesale on every sync.
// myPhoto: a fresh signed URL for the user's own photo (null = none, undefined = an upload is in flight, keep it).
export type Synced = Pick<State, 'going' | 'decisions' | 'messages' | 'closedChats' | 'blocked' | 'memberships'> & {
  syncedAt: string;
  myPhoto?: string | null;
};
export type Snapshot = { remote: RemoteData; synced: Synced };

const HISTORY_MS = 30 * DAY; // past events kept for chats, "Past events" and shared-event counts
const iso = (s: string) => new Date(s).toISOString(); // one timestamp format, so string comparisons stay valid

// chatId → match id, for writing messages and closing chats.
const matchByChat = new Map<string, string>();
// Everyone seen so far stays resolvable by id (e.g. names in "Blocked" after RLS hides them).
const knownUsers = new Map<string, User>();

const must = <T>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};

function toEvent(e: Tables<'events'>, going: number, solo: number, met: number): RemoteData['events'][number] {
  const poster = e.poster as Partial<Event['poster']> | null;
  return {
    id: e.id,
    communityId: e.community_id,
    authorId: e.personal ? (e.created_by ?? undefined) : undefined,
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
    metCount: met,
  };
}

export async function fetchSnapshot(me: string): Promise<Snapshot> {
  const since = new Date(Date.now() - HISTORY_MS).toISOString();
  const [communityRows, communityStats, memberRows, metRows, eventRows, attendances, profiles, decisions, matches, messages, blocks] = await Promise.all([
    supabase.from('communities').select('*').order('created_at').then(must),
    supabase.rpc('community_stats').then(must),
    supabase.from('community_members').select('community_id, joined_at').eq('user_id', me).then(must),
    supabase.rpc('met_events').then(must),
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

  // Counters exclude the user: the selectors add their own "I'm going" on top, as in the demo.
  const events = eventRows.map((e) => {
    const s = stats.find((x) => x.event_id === e.id);
    const myRow = mine.find((a) => a.event_id === e.id);
    const meSolo = myRow?.going_with === 'solo' && meProfile?.show_solo !== false;
    const met = metRows.find((x) => x.event_id === e.id)?.met ?? 0;
    return toEvent(e, Math.max(0, (s?.going ?? 0) - (myRow ? 1 : 0)), Math.max(0, (s?.solo ?? 0) - (meSolo ? 1 : 0)), met);
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

  const photos = await signedUrls(AVATARS, profiles.flatMap((p) => (p.photo_path ? [p.photo_path] : [])));
  const photoOf = (p: (typeof profiles)[number]) => (p.photo_path ? photos.get(p.photo_path) : undefined);

  for (const p of profiles) {
    if (p.id === me) continue;
    const shared = attendances.filter((a) => a.user_id === p.id && pastIds.has(a.event_id) && myEventIds.has(a.event_id)).length;
    knownUsers.set(p.id, {
      id: p.id,
      name: p.name,
      username: p.username,
      gender: (p.gender as User['gender']) ?? undefined,
      affiliation: p.affiliation,
      languages: (p.languages as User['languages']) ?? undefined,
      talkAbout: p.talk_about,
      tags: p.interests as InterestId[],
      gradient: p.gradient as GradientId,
      photoUri: photoOf(p),
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
        // Only a mutual "Go together" is ever visible: a one-sided one stays hidden (consent).
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

  const statsBy = new Map(communityStats.map((c) => [c.community_id, c]));
  const communities: Community[] = communityRows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    gradient: c.gradient as GradientId,
    photoUri: c.photo_path ? publicUrl(COVERS, c.photo_path) : undefined,
    emailDomain: c.email_domain,
    members: statsBy.get(c.id)?.members ?? 0,
    eventsThisWeek: statsBy.get(c.id)?.events_this_week ?? 0,
    mine: c.created_by === me,
  }));
  const memberships: Synced['memberships'] = {};
  for (const m of memberRows) memberships[m.community_id] = { at: iso(m.joined_at) };
  return {
    remote: {
      communities,
      events,
      users: [...knownUsers.values()],
      attendances: others,
    },
    synced: {
      going,
      decisions: myDecisions,
      messages: threads,
      closedChats,
      blocked,
      memberships,
      myPhoto: avatarUploads.pending ? undefined : ((meProfile && photoOf(meProfile)) ?? null),
      syncedAt: new Date().toISOString(),
    },
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

// ── Communities ────────────────────────────────────────────────────────

// photoUri: a freshly picked local image is uploaded; a key present with undefined removes the cover.
export type CommunityDraft = Pick<Community, 'name' | 'description' | 'gradient' | 'emailDomain' | 'photoUri'>;

// Uploads or removes the cover as the draft asks; the previous file is deleted best-effort.
async function syncCover(communityId: string, d: Partial<CommunityDraft>, previous: string | null) {
  if (!('photoUri' in d)) return;
  const uri = d.photoUri;
  if (uri ? !isPicked(uri) : !previous) return; // unchanged server cover, or nothing to remove
  const path = uri ? await uploadImage(COVERS, `communities/${communityId}`, uri) : null;
  ok(await supabase.from('communities').update({ photo_path: path }).eq('id', communityId));
  await removeImage(COVERS, previous);
}

export type EventDraft = Pick<Event, 'communityId' | 'title' | 'description' | 'startsAt' | 'endsAt' | 'venue' | 'address' | 'price' | 'category' | 'poster'>;

// Open communities are joined directly; a domain-only one goes through join_community(), which checks the address.
export const joinCommunity = (me: string, c: Community) =>
  c.emailDomain
    ? write(supabase.rpc('join_community', { p_community: c.id }))
    : write(supabase.from('community_members').upsert({ community_id: c.id, user_id: me }, { ignoreDuplicates: true }));

export const leaveCommunity = (me: string, communityId: string) =>
  write(supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', me));

export async function createCommunity(me: string, d: CommunityDraft): Promise<string> {
  const { data, error } = await supabase
    .from('communities')
    .insert({ name: d.name, description: d.description, gradient: d.gradient, email_domain: d.emailDomain, created_by: me })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await syncCover(data.id, d, null);
  return data.id;
}

export async function updateCommunity(communityId: string, d: Partial<CommunityDraft>) {
  const { data: current } = await supabase.from('communities').select('photo_path').eq('id', communityId).maybeSingle();
  ok(
    await supabase
      .from('communities')
      .update({
        ...(d.name !== undefined && { name: d.name }),
        ...(d.description !== undefined && { description: d.description }),
        ...(d.gradient !== undefined && { gradient: d.gradient }),
        ...(d.emailDomain !== undefined && { email_domain: d.emailDomain }),
      })
      .eq('id', communityId),
  );
  await syncCover(communityId, d, current?.photo_path ?? null);
}

export async function deleteCommunity(communityId: string) {
  // The file first: storage checks ownership through the community row.
  const { data: current } = await supabase.from('communities').select('photo_path').eq('id', communityId).maybeSingle();
  await removeImage(COVERS, current?.photo_path);
  ok(await supabase.from('communities').delete().eq('id', communityId));
}

// Only the author may do this: RLS checks created_by.
export const deleteEvent = (eventId: string) => write(supabase.from('events').delete().eq('id', eventId));

// Events created in the app are single-language: the same text goes into both language columns.
export async function createEvent(me: string, d: EventDraft): Promise<string> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      community_id: d.communityId,
      created_by: me,
      personal: d.communityId === null, // a city-wide row has no community either, so the flag is what tells them apart
      title_uk: d.title,
      title_en: d.title,
      description_uk: d.description,
      description_en: d.description,
      venue: d.venue,
      address: d.address,
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      price: d.price,
      category: d.category,
      poster: d.poster,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, soon)
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
