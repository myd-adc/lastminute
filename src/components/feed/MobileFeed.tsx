import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { prefetchImages } from '@/components/ui';
import type { Event } from '@/data/types';
import { tabBarClearance } from '@/lib/layout';
import { goingCount, metCount, soloCount } from '@/lib/selectors';
import { whenLabel } from '@/lib/time';
import { useTheme } from '@/theme';
import { useStore } from '@/store/AppStore';

import { EndOfFeed } from './EndOfFeed';
import { FeedPage } from './FeedPage';
import { MobileFeedSkeleton } from './FeedSkeleton';
import { FeedTabs } from './FeedTabs';
import { useToast } from './Toast';
import { useFeed } from './useFeed';

// M06 phone feed: full-height vertical pages (FlatList paging). Web also pages on wheel/trackpad and ↑/↓/←/→ keys.
export function MobileFeed() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const clearance = tabBarClearance(insets.bottom);
  const toast = useToast(clearance + 8);
  const { state, now, feed, previews, handlers, setTab } = useFeed(toast.show);
  const { loading } = useStore();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const listRef = useRef<FlatList<Event>>(null);
  const index = useRef(0);
  const feedRef = useRef(feed);
  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);
  const hasList = feed.length > 0 && size.h > 0;
  // Switching tabs starts the new stack from its first poster.
  useEffect(() => {
    index.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [state.feedTab]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  // Posters ahead of the current page start downloading now, so the next swipe lands on a loaded photo.
  const prefetchFrom = (i: number) => prefetchImages(feedRef.current.slice(i, i + 2).map((e) => e.image));
  useEffect(() => {
    prefetchImages(feed.slice(0, 3).map((e) => e.image));
  }, [feed]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size.h) return;
    const i = Math.round(e.nativeEvent.contentOffset.y / size.h);
    if (i !== index.current) prefetchFrom(i + 1);
    index.current = i;
  };

  const goTo = useCallback((i: number) => {
    const n = feedRef.current.length;
    if (!n) return;
    const next = Math.max(0, Math.min(n - 1, i));
    index.current = next;
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, []);

  // Web: one page per wheel gesture and arrow keys, only while the feed is the focused screen.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || typeof window === 'undefined' || !hasList) return;
      const current = () => feedRef.current[Math.min(index.current, feedRef.current.length - 1)];
      const onKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        if (e.key === 'ArrowDown') goTo(index.current + 1);
        else if (e.key === 'ArrowUp') goTo(index.current - 1);
        else if (e.key === 'ArrowRight' && current()) handlers.onGo(current().id);
        else if (e.key === 'ArrowLeft' && current()) handlers.onSkip(current().id);
        else return;
        e.preventDefault();
      };
      let lockedUntil = 0;
      let acc = 0;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const ts = Date.now();
        if (ts < lockedUntil) return;
        acc += e.deltaY;
        if (Math.abs(acc) < 30) return;
        goTo(index.current + (acc > 0 ? 1 : -1));
        acc = 0;
        lockedUntil = ts + 650;
      };
      const node = (listRef.current?.getScrollableNode?.() ?? null) as HTMLElement | null;
      window.addEventListener('keydown', onKey);
      node?.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        window.removeEventListener('keydown', onKey);
        node?.removeEventListener('wheel', onWheel);
      };
    }, [goTo, handlers, hasList]),
  );

  const header = (onPoster: boolean) => (
    <FeedTabs value={state.feedTab} onChange={setTab} onPoster={onPoster} savedCount={Object.keys(state.saved).length} />
  );

  const renderItem = ({ item }: { item: Event }) => (
    <FeedPage
      event={item}
      width={size.w}
      height={size.h}
      shift={insets.top - 50}
      bottomClearance={clearance}
      when={whenLabel(item.startsAt, now)}
      saved={!!state.saved[item.id]}
      goingN={goingCount(state, item)}
      soloN={soloCount(state, item)}
      metN={metCount(state, item)}
      preview={previews[item.id]}
      {...handlers}
    />
  );

  if (loading) return <MobileFeedSkeleton header={header(false)} />;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} onLayout={onLayout}>
      {feed.length === 0 ? (
        <EndOfFeed header={header(false)} contentStyle={{ paddingTop: insets.top + 8, paddingBottom: clearance }} />
      ) : (
        size.h > 0 && (
          <>
            <FlatList
              ref={listRef}
              data={feed}
              keyExtractor={(e) => e.id}
              renderItem={renderItem}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={size.h}
              getItemLayout={(_, i) => ({ length: size.h, offset: size.h * i, index: i })}
              onScroll={onScroll}
              scrollEventThrottle={32}
              windowSize={3}
              initialNumToRender={2}
              maxToRenderPerBatch={2}
            />
            <View style={[styles.header, { top: insets.top + 8 }]}>{header(true)}</View>
          </>
        )
      )}
      {toast.node}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { position: 'absolute', left: 20, right: 20 },
});
