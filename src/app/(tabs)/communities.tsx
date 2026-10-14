import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CommunityCard } from '@/components/community/CommunityCard';
import { CommunityCardsSkeleton } from '@/components/skeletons/ListSkeletons';
import { Button, Screen, ScreenTitle } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { discoverCommunities, myCommunities } from '@/lib/selectors';
import { useStore } from '@/store/AppStore';
import { display, onest, useTheme } from '@/theme';

// M18 «Спільноти» tab: the user's communities, ones to discover, and starting a new one.
export default function CommunitiesScreen() {
  const { c } = useTheme();
  const { state, loading } = useStore();
  const { t } = useT();
  const wide = useIsWide();
  const mine = myCommunities(state);
  const other = discoverCommunities(state);

  return (
    <Screen withTabBar contentStyle={[styles.content, wide && styles.wide]}>
      <ScreenTitle title={t('community.list.title')} />
      <Text style={[onest('regular', 15, 21), { color: c.muted, marginTop: -6 }]}>{t('community.list.sub')}</Text>

      {loading ? (
        <View style={{ marginTop: 8 }}>
          <CommunityCardsSkeleton />
        </View>
      ) : (
        <>
          <Text style={[display(16, 20), styles.heading, { color: c.text }]}>{t('community.list.yours')}</Text>
          <View style={styles.list}>
            {mine.length ? (
              mine.map((cm) => <CommunityCard key={cm.id} community={cm} member />)
            ) : (
              <Text style={[onest('regular', 14, 19), { color: c.muted }]}>{t('community.list.emptyYours')}</Text>
            )}
          </View>

          <Text style={[display(16, 20), styles.heading, { color: c.text }]}>{t('community.list.discover')}</Text>
          <View style={styles.list}>
            {other.length ? (
              other.map((cm) => <CommunityCard key={cm.id} community={cm} member={false} />)
            ) : (
              <Text style={[onest('regular', 14, 19), { color: c.muted }]}>{t('community.list.emptyDiscover')}</Text>
            )}
          </View>
        </>
      )}

      {/* M18 keeps the CTA just above the tab bar; on a long list (and on wide web) it simply follows it. */}
      {!wide && <View style={styles.spacer} />}
      <Button label={t('community.list.create')} onPress={() => router.push('/community/new')} style={[styles.create, wide && styles.createWide]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  wide: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  heading: { marginTop: 8, marginBottom: -4 },
  list: { gap: 12 },
  spacer: { flexGrow: 1 },
  create: { marginTop: 12 },
  createWide: { alignSelf: 'flex-start', paddingHorizontal: 32 },
});
