import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';

import { saveProfile } from '@/api/auth';
import { isLive, supabase } from '@/api/client';
import * as api from '@/api/sync';
import { attendanceOf, setDataLanguage, setLocalData, setRemoteData } from '@/data/mock';
import { setLang } from '@/i18n/core';
import type { Community, Message } from '@/data/types';

import { initialState, reducer, STATE_VERSION, type Action, type State } from './state';

export * from './state';

const STORAGE_KEY = 'lastminute:state';
// Live backend: last server snapshot, so a cold start renders real data before the first sync lands.
const REMOTE_KEY = 'lastminute:remote';

let seq = 0;
export const newId = (prefix = 'm') => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

type Store = {
  state: State;
  dispatch: (action: Action) => void;
  hydrated: boolean;
  // Sends a message as the user. Demo: in a DM the other side answers with their next scripted reply.
  sendMessage: (chatId: string, text: string) => void;
  // Room swipe; resolves to whether it completed a match (live: once the server confirms it).
  decide: (eventId: string, userId: string, choice: 'go' | 'skip') => Promise<boolean>;
  // Communities: creating returns the new id (live: once the server has it), joining resolves to whether it worked.
  createCommunity: (draft: api.CommunityDraft) => Promise<string | null>;
  addEvent: (draft: api.EventDraft) => Promise<string | null>;
  joinCommunity: (community: Community) => Promise<boolean>;
};

const EMPTY_REMOTE = { communities: [], events: [], users: [], attendances: [] };

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Live backend: signed-in user id and the running sync (null in demo mode and when signed out).
  const meRef = useRef<string | null>(null);
  const syncRef = useRef<ReturnType<typeof api.startSync> | null>(null);
  const resync = useCallback(() => syncRef.current?.resync(), []);

  // Local state changes first (optimistic); the server write follows and the next sync settles any conflict.
  const dispatch = useCallback(
    (action: Action) => {
      const next = reducer(stateRef.current, action);
      stateRef.current = next;
      baseDispatch(action);
      if (!isLive) return;
      if (action.type === 'logout') {
        supabase.auth.signOut().catch(() => {});
        return;
      }
      const me = meRef.current;
      const write = me ? mirror(me, action, next) : undefined;
      write?.then(resync, resync);
    },
    [resync],
  );

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, REMOTE_KEY])
      .then(([[, raw], [, remote]]) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as State;
        if (saved.version !== STATE_VERSION) return;
        if (isLive && remote && saved.onboarded) setRemoteData(JSON.parse(remote));
        dispatch({ type: 'hydrate', state: { ...initialState, ...saved } });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {}), 300);
    return () => clearTimeout(id);
  }, [state, hydrated]);

  useEffect(() => {
    if (!isLive || !hydrated || !state.onboarded) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (cancelled) return;
      if (!uid) return baseDispatch({ type: 'logout' });
      meRef.current = uid;
      syncRef.current = api.startSync(uid, {
        onSnapshot: (snap) => {
          setRemoteData(snap.remote);
          AsyncStorage.setItem(REMOTE_KEY, JSON.stringify(snap.remote)).catch(() => {});
          baseDispatch({ type: 'sync', synced: snap.synced });
        },
        onSignedOut: () => baseDispatch({ type: 'logout' }),
        onError: (e) => __DEV__ && console.warn('[sync]', e),
      });
    });
    return () => {
      cancelled = true;
      syncRef.current?.stop();
      syncRef.current = null;
      meRef.current = null;
      setRemoteData(EMPTY_REMOTE, false);
      AsyncStorage.removeItem(REMOTE_KEY).catch(() => {});
    };
  }, [hydrated, state.onboarded]);

  const decide = useCallback(
    async (eventId: string, userId: string, choice: 'go' | 'skip') => {
      baseDispatch({ type: 'decide', eventId, userId, choice });
      if (!isLive) return choice === 'go' && !!attendanceOf(eventId, userId)?.likesYou && !stateRef.current.blocked[userId];
      const me = meRef.current;
      if (!me) return false;
      try {
        const matched = await api.decide(me, eventId, userId, choice);
        // The match screen reads the match from the store, so wait for it to land there.
        if (matched) await resync();
        else void resync();
        return matched;
      } catch {
        void resync();
        return false;
      }
    },
    [resync],
  );

  const sendMessage = useCallback((chatId: string, text: string) => {
    const now = Date.now() + stateRef.current.demoOffsetMs;
    const message: Message = { id: newId(), from: 'me', text, at: new Date(now).toISOString() };
    baseDispatch({ type: 'addMessage', chatId, message });
    if (isLive) {
      const me = meRef.current;
      if (me) api.sendMessage(me, chatId, text).then(resync, resync);
      return;
    }

    if (!chatId.startsWith('dm:')) return;
    const [, eventId, userId] = chatId.split(':');
    const replies = attendanceOf(eventId, userId)?.replies ?? [];
    const mineSoFar = (stateRef.current.messages[chatId] ?? []).filter((m) => m.from === 'me').length; // before this one
    const reply = replies[mineSoFar];
    if (!reply) return;
    setTimeout(() => {
      const at = new Date(Date.now() + stateRef.current.demoOffsetMs).toISOString();
      baseDispatch({ type: 'addMessage', chatId, message: { id: newId(), from: userId, text: reply, at } });
    }, 1400);
  }, [resync]);

  // Plain functions (formatters, mock data getters) read the language from module state; sync it before children render.
  setLang(state.language);
  setDataLanguage(state.language);
  setLocalData(state.localCommunities, state.localEvents);

  const createCommunity = useCallback(
    async (draft: api.CommunityDraft) => {
      if (!isLive) {
        const id = newId('c');
        baseDispatch({ type: 'createCommunity', community: { ...draft, id, members: 1, eventsThisWeek: 0, mine: true } });
        return id;
      }
      const me = meRef.current;
      if (!me) return null;
      try {
        const id = await api.createCommunity(me, draft);
        await resync();
        return id;
      } catch {
        return null;
      }
    },
    [resync],
  );

  const addEvent = useCallback(
    async (draft: api.EventDraft) => {
      if (!isLive) {
        const id = newId('e');
        baseDispatch({ type: 'createEvent', event: { ...draft, id, partner: false, goingCount: 0, soloCount: 0 } });
        return id;
      }
      const me = meRef.current;
      if (!me) return null;
      try {
        const id = await api.createEvent(me, draft);
        await resync();
        return id;
      } catch {
        return null;
      }
    },
    [resync],
  );

  const joinCommunity = useCallback(
    async (community: Community) => {
      if (!isLive) {
        baseDispatch({ type: 'joinCommunity', communityId: community.id });
        return true;
      }
      const me = meRef.current;
      if (!me) return false;
      try {
        await api.joinCommunity(me, community);
        await resync();
        return true;
      } catch {
        void resync();
        return false;
      }
    },
    [resync],
  );

  const value = useMemo(
    () => ({ state, dispatch, hydrated, sendMessage, decide, createCommunity, addEvent, joinCommunity }),
    [state, dispatch, hydrated, sendMessage, decide, createCommunity, addEvent, joinCommunity],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Server write for an action, if it has one. Room swipes and messages go through `decide` / `sendMessage`.
function mirror(me: string, action: Action, next: State): Promise<unknown> | undefined {
  switch (action.type) {
    case 'go':
    case 'setGoing': {
      const g = next.going[action.eventId];
      return g ? api.markGoing(me, action.eventId, g) : undefined;
    }
    case 'leave':
      return api.leaveEvent(me, action.eventId);
    case 'decide':
      return api.decide(me, action.eventId, action.userId, action.choice);
    case 'closeChat':
      return action.chatId.startsWith('dm:') ? api.closeChat(me, action.chatId) : undefined;
    case 'block':
      return api.block(me, action.userId);
    case 'unblock':
      return api.unblock(me, action.userId);
    case 'report':
      return api.report(me, action.report).then(() => (action.report.alsoBlock ? api.block(me, action.report.userId) : undefined));
    case 'leaveCommunity':
      return api.leaveCommunity(me, action.communityId);
    case 'updateCommunity': {
      const { name, description, gradient, emailDomain, photoUri } = action.patch;
      return api.updateCommunity(action.communityId, { name, description, gradient, emailDomain, ...('photoUri' in action.patch && { photoUri }) });
    }
    case 'deleteCommunity':
      return api.deleteCommunity(action.communityId);
    case 'setMe':
    case 'setPreferences':
    case 'setPrivacy':
    case 'setLanguage':
      return next.onboarded
        ? saveProfile(next).then((r) => {
            if (!r.ok) throw new Error(r.error);
          })
        : undefined;
    default:
      return undefined;
  }
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside AppStoreProvider');
  return store;
}

// Demo-aware clock: real time shifted by the demo offset from Settings, re-rendering every 30 s.
export function useNow(intervalMs = 30_000) {
  const { state } = useStore();
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick + state.demoOffsetMs;
}

