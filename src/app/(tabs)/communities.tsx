import { router } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CommunityCard } from '@/components/community/CommunityCard';
import { CommunityCardsSkeleton } from '@/components/skeletons/ListSkeletons';
import { Button, Screen, ScreenTitle } from '@/components/ui';
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
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const mine = useMemo(() => myCommunities(state).filter((cm) => matches(cm, query)), [state, query]);
  const other = useMemo(() => discoverCommunities(state).filter((cm) => matches(cm, query)), [state, query]);
  const capped = query || expanded || wide ? other : other.slice(0, DISCOVER_PREVIEW);
  const hidden = other.length - capped.length;

  return (
    <Screen withTabBar contentStyle={[styles.content, wide && styles.wide]}>
      <ScreenTitle
        title={t('community.list.title')}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(searching ? 'community.list.closeSearch' : 'community.list.search')}
            hitSlop={12}
            onPress={() => {
              setSearching((v) => !v);
              setQuery('');
            }}
          >
            {searching ? <X size={22} color={c.text} /> : <Search size={22} color={c.text} />}
          </Pressable>
        }
      />
      {searching ? (
        <View style={[styles.search, { backgroundColor: c.surface }]}>
          <Search size={18} color={c.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder={t('community.list.searchPlaceholder')}
            placeholderTextColor={c.muted}
            style={[styles.searchInput, onest('regular', 15), { color: c.text }]}
          />
        </View>
      ) : (
        <Text style={[onest('regular', 15, 21), { color: c.muted, marginTop: -6 }]}>{t('community.list.sub')}</Text>
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
                {query ? t('community.list.noMatch') : t('community.list.emptyDiscover')}
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

      {/* The phone creates from the «+» in the glass tab bar; wide web has no such bar, so it keeps the buttons. */}
      {wide && (
        <>
          <Button label={t('feed.own.create')} onPress={() => router.push('/event/new')} style={[styles.create, styles.createWide]} />
          <Button label={t('community.list.create')} variant="secondary" onPress={() => router.push('/community/new')} style={[styles.second, styles.createWide]} />
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
  create: { marginTop: 12 },
  second: { marginTop: 10 },
  createWide: { alignSelf: 'flex-start', paddingHorizontal: 32 },
});
