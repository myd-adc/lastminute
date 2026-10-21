import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { attendeesOf, events, getUser } from '@/data/mock';
import type { Event } from '@/data/types';
import { feedEvents } from '@/lib/selectors';
import { useNow, useStore, type FeedTab } from '@/store/AppStore';

import type { FeedHandlers, PeoplePreview } from './FeedPage';

// Shared data + actions for the phone (M06) and wide-web (W03) feeds.
export function useFeed() {
  const { state, dispatch } = useStore();
  // The rail's "Send" opens the QR sheet for that card, as on the details screen.
  const [sharing, setSharing] = useState<Event | null>(null);
  const now = useNow();
  const feed = useMemo(() => feedEvents(state, now), [state, now]);

  // Avatar previews depend only on mock data (rebuilt per language) + blocked users, so identities survive clock ticks.
  const blocked = state.blocked;
  const lang = state.language;
  const syncedAt = state.syncedAt;
  const previews = useMemo(() => {
    const map: Record<string, PeoplePreview> = {};
    for (const e of events) {
      const people = attendeesOf(e.id)
        .filter((a) => !blocked[a.userId])
        .map((a) => getUser(a.userId))
        .filter((u) => !!u)
        .slice(0, 3)
        .map((u) => ({ name: u.name, gradient: u.gradient }));
      map[e.id] = { people };
    }
    return map;
    // `lang`, `syncedAt`: the data arrays are live bindings swapped on language change and server sync, so re-read them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked, lang, syncedAt]);

  const handlers: FeedHandlers = useMemo(
    () => ({
      onOpen: (id) => router.push({ pathname: '/event/[id]', params: { id } }),
      onSave: (id) => dispatch({ type: 'toggleSaved', eventId: id }),
      onShare: (e: Event) => setSharing(e),
      onSkip: (id) => dispatch({ type: 'skipEvent', eventId: id }),
      onGo: (id) => {
        dispatch({ type: 'go', eventId: id });
        router.push({ pathname: '/event/[id]/going', params: { id } });
      },
    }),
    [dispatch],
  );

  const setTab = useCallback((tab: FeedTab) => dispatch({ type: 'setFeedTab', tab }), [dispatch]);

  const closeShare = useCallback(() => setSharing(null), []);

  return { state, dispatch, now, feed, previews, handlers, setTab, sharing, closeShare };
}
