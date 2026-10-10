import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { attendeesOf, events, getScene, getUser } from '@/data/mock';
import type { Event } from '@/data/types';
import { t } from '@/i18n/translate';
import { feedEvents } from '@/lib/selectors';
import { useNow, useStore, type FeedTab } from '@/store/AppStore';

import type { FeedHandlers, PeoplePreview } from './FeedPage';
import { shareEvent } from './share';

// Shared data + actions for the phone (M06) and wide-web (W03) feeds.
export function useFeed(showToast: (msg: string) => void) {
  const { state, dispatch } = useStore();
  const now = useNow();
  const feed = useMemo(() => feedEvents(state, now), [state, now]);
  const scene = state.sceneId ? getScene(state.sceneId) : null;

  // Avatar previews depend only on mock data (rebuilt per language) + blocked users, so identities survive clock ticks.
  const blocked = state.blocked;
  const lang = state.language;
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
    // `lang`: mock arrays are live bindings swapped on language change, so names must be re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked, lang]);

  const nowRef = useRef(now);
  useEffect(() => {
    nowRef.current = now;
  }, [now]);

  const handlers: FeedHandlers = useMemo(
    () => ({
      onOpen: (id) => router.push({ pathname: '/event/[id]', params: { id } }),
      onSave: (id) => dispatch({ type: 'toggleSaved', eventId: id }),
      onShare: (e: Event) => {
        shareEvent(e, nowRef.current).then((r) => {
          if (r === 'copied') showToast(t('feed.toast.linkCopied'));
          else if (r === 'failed') showToast(t('feed.toast.shareFailed'));
        });
      },
      onSkip: (id) => dispatch({ type: 'skipEvent', eventId: id }),
      onGo: (id) => {
        dispatch({ type: 'go', eventId: id });
        router.push({ pathname: '/event/[id]/going', params: { id } });
      },
    }),
    [dispatch, showToast],
  );

  const setTab = useCallback((tab: FeedTab) => dispatch({ type: 'setFeedTab', tab }), [dispatch]);

  return { state, dispatch, now, feed, scene, previews, handlers, setTab };
}
