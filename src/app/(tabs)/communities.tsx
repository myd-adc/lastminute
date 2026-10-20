import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CommunityCard } from '@/components/community/CommunityCard';
import { CommunityCardsSkeleton } from '@/components/skeletons/ListSkeletons';
import { Chip, Screen, ScreenTitle } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Community } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { discoverCommunities, myCommunities } from '@/lib/selectors';
import { useStore } from '@/store/AppStore';
import { display, onest, useTheme } from '@/theme';

// A phone shows this many before the list asks to be opened up; searching ignores the cap.
const DISCOVER_PREVIEW = 5;

const matches = (cm: Community, q: string) =>
  `${cm.name} ${cm.emailDomain ?? ''} ${cm.description}`.toLowerCase().includes(q.trim().toLowerCase());

// M18 "Communities" tab: the ones the user is in (compact, they are navigation), the ones to discover, and a
// search that cuts through both — a person can be in a dozen and there are many more to find.
export default function CommunitiesScreen() {
  const { c } = useTheme();
  const { state, loading } = useStore();
  const { t } = useT();
  const wide = useIsWide();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [expanded, setExpanded] = useState(false);

  const mine = useMemo(() => myCommunities(state).filter((cm) => matches(cm, query)), [state, query]);
  const other = useMemo(
    () =>
      discoverCommunities(state).filter(
        (cm) => matches(cm, query) && (filter === 'all' || (filter === 'closed') === !!cm.emailDomain),
      ),
    [state, query, filter],
  );
  const capped = query || filter !== 'all' || expanded ? other : other.slice(0, wide ? DISCOVER_PREVIEW * 2 : DISCOVER_PREVIEW);
  const hidden = other.length - capped.length;

  return (
    <Screen withTabBar contentStyle={[styles.content, wide && styles.wide]}>
      <ScreenTitle title={t('community.list.title')} />
      <Text style={[onest('regular', 15, 21), { color: c.muted, marginTop: -6 }]}>{t('community.list.sub')}</Text>
      {/* With dozens of communities, finding one is the main job: the search is always there, plus a filter by access. */}
      <View style={[styles.search, { backgroundColor: c.surface }]}>
        <Search size={18} color={c.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('community.list.searchPlaceholder')}
          placeholderTextColor={c.muted}
          accessibilityLabel={t('community.list.search')}
          style={[styles.searchInput, onest('regular', 15), { color: c.text }]}
        />
        {!!query && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('community.list.closeSearch')} hitSlop={10} onPress={() => setQuery('')}>
            <X size={18} color={c.muted} />
          </Pressable>
        )}
      </View>
      <View style={styles.filters}>
        {(['all', 'open', 'closed'] as const).map((f) => (
          <Chip key={f} label={t(`community.list.filter.${f}`)} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>
      {/* Newcomers kept asking what a community is for; once they are in one, the list explains itself. */}
      {!loading && !query && myCommunities(state).length === 0 && (
        <View style={[styles.how, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Text style={[onest('bold', 15, 19), { color: c.text }]}>{t('community.list.howTitle')}</Text>
          {(['howWhat', 'howJoin', 'howClosed'] as const).map((k, i) => (
            <View key={k} style={styles.howRow}>
              <View style={[styles.howNum, { backgroundColor: c.accent }]}>
                <Text style={[onest('bold', 12, 15), { color: c.onAccent }]}>{i + 1}</Text>
              </View>
              <Text style={[onest('regular', 14, 19), { color: c.muted, flex: 1 }]}>{t(`community.list.${k}`)}</Text>
            </View>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ marginTop: 8 }}>
          <CommunityCardsSkeleton />
        </View>
      ) : (
        <>
          <Text style={[display(16, 20), styles.heading, { color: c.text }]}>{t('community.list.yours')}</Text>
          <View style={styles.mineList}>
            {mine.length ? (
              mine.map((cm) => <CommunityCard key={cm.id} community={cm} member compact />)
            ) : (
              <Text style={[onest('regular', 14, 19), { color: c.muted }]}>
                {query ? t('community.list.noMatch') : t('community.list.emptyYours')}
              </Text>
            )}
          </View>

          <Text style={[display(16, 20), styles.heading, { color: c.text }]}>{t('community.list.discover')}</Text>
          <View style={styles.list}>
            {capped.length ? (
              capped.map((cm) => <CommunityCard key={cm.id} community={cm} member={false} />)
            ) : (
              <Text style={[onest('regular', 14, 19), { color: c.muted }]}>
                {query || filter !== 'all' ? t('community.list.noMatch') : t('community.list.emptyDiscover')}
              </Text>
            )}
          </View>
          {hidden > 0 && (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setExpanded(true)} style={styles.more}>
              <Text style={[onest('semibold', 14, 18), { color: c.accentInk }]}>{t('community.list.showMore', { count: hidden })}</Text>
            </Pressable>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  wide: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 24, paddingHorizontal: 16 },
  searchInput: { flex: 1, height: 48 },
  heading: { marginTop: 8, marginBottom: -4 },
  mineList: { gap: 8 },
  list: { gap: 12 },
  more: { alignSelf: 'center', paddingVertical: 4 },
  filters: { flexDirection: 'row', gap: 8, marginTop: -4 },
  how: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  howNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
