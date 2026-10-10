import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { tabBarClearance } from '@/lib/layout';
import { goingCount, soloCount } from '@/lib/selectors';
import { whenLabel } from '@/lib/time';
import { useTheme } from '@/theme';

import { EndOfFeed } from './EndOfFeed';
import { FeedPage } from './FeedPage';
import { FeedTabs } from './FeedTabs';
import { FilterSheet } from './FilterSheet';
import { sceneName } from './format';
import { useToast } from './Toast';
import { useFeed } from './useFeed';

// M06 phone feed: full-height vertical pages (FlatList paging). Web also pages on wheel/trackpad and ↑/↓/←/→ keys.
export function MobileFeed() {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const clearance = tabBarClearance(insets.bottom);
  const toast = useToast(clearance + 8);
  const { state, dispatch, now, feed, scene, previews, handlers, setTab } = useFeed(toast.show);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [filters, setFilters] = useState(false);
  const listRef = useRef<FlatList<Event>>(null);
  const index = useRef(0);
  const feedRef = useRef(feed);
  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);
  const hasList = feed.length > 0 && size.h > 0;
  // Switching scene / city / saved starts the new stack from its first poster.
  useEffect(() => {
    index.current = 0;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [state.feedTab]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.h) index.current = Math.round(e.nativeEvent.contentOffset.y / size.h);
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

  const sceneLabel = scene ? t('feed.tabs.myScene', { scene: scene.name }) : t('common.myScene');
  const header = (onPoster: boolean) => (
    <FeedTabs value={state.feedTab} onChange={setTab} sceneLabel={sceneLabel} onPoster={onPoster} onFilters={() => setFilters(true)} />
  );

  const renderItem = ({ item }: { item: Event }) => (
    <FeedPage
      event={item}
      width={size.w}
      height={size.h}
      posterTop={insets.top + 70}
      bottomClearance={clearance}
      when={whenLabel(item.startsAt, now)}
      saved={!!state.saved[item.id]}
      goingN={goingCount(state, item)}
      soloN={soloCount(state, item)}
      scene={sceneName(item)}
      preview={previews[item.id]}
      {...handlers}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} onLayout={onLayout}>
      {feed.length === 0 ? (
        <EndOfFeed header={header(false)} contentStyle={{ paddingTop: insets.top + 12, paddingBottom: clearance }} />
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
            <View style={[styles.header, { top: insets.top + 12 }]}>{header(true)}</View>
          </>
        )
      )}
      <FilterSheet
        visible={filters}
        onClose={() => setFilters(false)}
        value={state.feedTab}
        onChange={setTab}
        sceneLabel={sceneLabel}
        savedCount={Object.keys(state.saved).length}
        skippedCount={Object.keys(state.skipped).length}
        onResetSkipped={() => dispatch({ type: 'resetSkipped' })}
      />
      {toast.node}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { position: 'absolute', left: 20, right: 20 },
});
