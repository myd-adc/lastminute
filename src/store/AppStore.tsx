import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';

import { attendanceOf, setDataLanguage } from '@/data/mock';
import { setLang } from '@/i18n/core';
import type { Message } from '@/data/types';

import { initialState, reducer, STATE_VERSION, type Action, type State } from './state';

export * from './state';

const STORAGE_KEY = 'lastminute:state';

let seq = 0;
export const newId = (prefix = 'm') => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

type Store = {
  state: State;
  dispatch: (action: Action) => void;
  hydrated: boolean;
  // Sends a message as the user. In a DM the other side answers with their next scripted reply.
  sendMessage: (chatId: string, text: string) => void;
};

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as State;
        if (saved.version === STATE_VERSION) dispatch({ type: 'hydrate', state: { ...initialState, ...saved } });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {}), 300);
    return () => clearTimeout(id);
  }, [state, hydrated]);

  const sendMessage = useCallback((chatId: string, text: string) => {
    const now = Date.now() + stateRef.current.demoOffsetMs;
    const message: Message = { id: newId(), from: 'me', text, at: new Date(now).toISOString() };
    dispatch({ type: 'addMessage', chatId, message });

    if (!chatId.startsWith('dm:')) return;
    const [, eventId, userId] = chatId.split(':');
    const replies = attendanceOf(eventId, userId)?.replies ?? [];
    const mineSoFar = (stateRef.current.messages[chatId] ?? []).filter((m) => m.from === 'me').length; // before this one
    const reply = replies[mineSoFar];
    if (!reply) return;
    setTimeout(() => {
      const at = new Date(Date.now() + stateRef.current.demoOffsetMs).toISOString();
      dispatch({ type: 'addMessage', chatId, message: { id: newId(), from: userId, text: reply, at } });
    }, 1400);
  }, []);

  // Plain functions (formatters, mock data getters) read the language from module state; sync it before children render.
  setLang(state.language);
  setDataLanguage(state.language);

  const value = useMemo(() => ({ state, dispatch, hydrated, sendMessage }), [state, hydrated, sendMessage]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
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

