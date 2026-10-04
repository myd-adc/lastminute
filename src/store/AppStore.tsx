import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { attendanceOf, attendances } from '@/data/mock';
import type { Message, SceneId } from '@/data/types';

export type MyProfile = {
  name: string;
  affiliation: string;
  bio: string;
  tags: string[];
};

export const CHAT_TTL_MS = 24 * 60 * 60 * 1000;

// Student email domains accepted for verification.
export const STUDENT_DOMAINS = ['lpnu.ua', 'ucu.edu.ua', 'lnu.edu.ua'];

type State = {
  me: MyProfile | null;
  verifiedEmail: string | null;
  visible: boolean; // "Показувати мене на подіях"
  myScenes: SceneId[];
  sceneFilter: SceneId | 'all';
  search: string;
  going: Record<string, boolean>; // eventId
  interestsSent: Record<string, string>; // pairKey -> ISO time sent
  blocked: Record<string, boolean>; // userId
  messages: Record<string, Message[]>; // pairKey
};

type Action =
  | { type: 'setProfile'; profile: MyProfile }
  | { type: 'verify'; email: string }
  | { type: 'setVisible'; visible: boolean }
  | { type: 'toggleScene'; sceneId: SceneId }
  | { type: 'setSceneFilter'; filter: SceneId | 'all' }
  | { type: 'setSearch'; search: string }
  | { type: 'go'; eventId: string }
  | { type: 'leave'; eventId: string }
  | { type: 'sendInterest'; eventId: string; userId: string }
  | { type: 'block'; userId: string }
  | { type: 'unblock'; userId: string }
  | { type: 'sendMessage'; eventId: string; userId: string; text: string };

export const pairKey = (eventId: string, userId: string) => `${eventId}:${userId}`;

const initialState: State = {
  me: null,
  verifiedEmail: null,
  visible: true,
  myScenes: ['polytech', 'ucu'],
  sceneFilter: 'all',
  search: '',
  going: {},
  interestsSent: {},
  blocked: {},
  messages: {},
};

let messageSeq = 0;
const message = (fromMe: boolean, text: string): Message => ({
  id: `m${++messageSeq}`,
  fromMe,
  text,
  sentAt: new Date().toISOString(),
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setProfile':
      return { ...state, me: action.profile };
    case 'verify':
      return { ...state, verifiedEmail: action.email };
    case 'setVisible':
      return { ...state, visible: action.visible };
    case 'toggleScene': {
      const has = state.myScenes.includes(action.sceneId);
      const myScenes = has ? state.myScenes.filter((s) => s !== action.sceneId) : [...state.myScenes, action.sceneId];
      if (myScenes.length === 0) return state; // at least one scene
      const sceneFilter = state.sceneFilter !== 'all' && !myScenes.includes(state.sceneFilter) ? 'all' : state.sceneFilter;
      return { ...state, myScenes, sceneFilter };
    }
    case 'setSceneFilter':
      return { ...state, sceneFilter: action.filter };
    case 'setSearch':
      return { ...state, search: action.search };
    case 'go':
      return { ...state, going: { ...state.going, [action.eventId]: true } };
    case 'leave': {
      const { [action.eventId]: _, ...going } = state.going;
      return { ...state, going };
    }
    case 'sendInterest': {
      const key = pairKey(action.eventId, action.userId);
      if (state.interestsSent[key]) return state;
      const next = { ...state, interestsSent: { ...state.interestsSent, [key]: new Date().toISOString() } };
      // Mutual interest opens the chat; the other side's first message arrives right away.
      const opener = attendanceOf(action.eventId, action.userId)?.wantsToGoWithYou?.opener;
      if (opener) next.messages = { ...state.messages, [key]: [message(false, opener)] };
      return next;
    }
    case 'block':
      return { ...state, blocked: { ...state.blocked, [action.userId]: true } };
    case 'unblock': {
      const { [action.userId]: _, ...blocked } = state.blocked;
      return { ...state, blocked };
    }
    case 'sendMessage': {
      const key = pairKey(action.eventId, action.userId);
      return {
        ...state,
        messages: { ...state.messages, [key]: [...(state.messages[key] ?? []), message(true, action.text)] },
      };
    }
  }
}

export type MatchInfo = { eventId: string; userId: string; matchedAt: string; expiresAt: number };

type Store = {
  state: State;
  dispatch: (action: Action) => void;
  wantsMe: (eventId: string, userId: string) => boolean;
  // A match exists when both sides sent interest for the same event.
  isMatch: (eventId: string, userId: string) => boolean;
  matchOf: (eventId: string, userId: string) => MatchInfo | null;
  matches: MatchInfo[];
};

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const store = useMemo<Store>(() => {
    const wantsMe = (eventId: string, userId: string) => !!attendanceOf(eventId, userId)?.wantsToGoWithYou;
    const matchOf = (eventId: string, userId: string): MatchInfo | null => {
      const sentAt = state.interestsSent[pairKey(eventId, userId)];
      if (!sentAt || !wantsMe(eventId, userId) || state.blocked[userId]) return null;
      return { eventId, userId, matchedAt: sentAt, expiresAt: Date.parse(sentAt) + CHAT_TTL_MS };
    };
    const matches = attendances
      .map((a) => matchOf(a.eventId, a.userId))
      .filter((m): m is MatchInfo => !!m)
      .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt));
    return {
      state,
      dispatch,
      wantsMe,
      matchOf,
      matches,
      isMatch: (eventId, userId) => !!matchOf(eventId, userId),
    };
  }, [state]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}
