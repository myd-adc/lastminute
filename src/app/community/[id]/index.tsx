import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EventRow } from '@/components/community/EventRow';
import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { communityCounts } from '@/components/community/text';
import { useDomainJoin } from '@/components/community/DomainJoin';
import { PageHead } from '@/components/community/PageHead';
import { Glow, glows } from '@/components/profile/Glow';
import { Button, goBack, Pill, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getCommunity } from '@/data/mock';
import type { Community } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, webHitArea } from '@/lib/layout';
import { communityEvents, goingCount, isMember } from '@/lib/selectors';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

// M19 community page (join with e-mail for domain-only ones) and M19b, the creator's view (add event, settings).
export default function CommunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { c } = useTheme();
  const community = getCommunity(id);
  if (!community)
    return (
      <Screen>
        <Back />
        <Text style={[display(24, 30), { color: c.text }]}>{t('community.page.notFound')}</Text>
        <Text style={[type.body, { color: c.muted }]}>{t('community.page.notFoundSub')}</Text>
      </Screen>
    );
  return <CommunityPage community={community} />;
}

function Back({ right }: { right?: ReactNode }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack('/communities')} style={webHitArea(26)}>
        <ChevronLeft size={26} color={c.text} strokeWidth={2} />
      </Pressable>
      {right}
    </View>
  );
}

function CommunityPage({ community }: { community: Community }) {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch, joinCommunity } = useStore();
  const now = useNow();
  const wide = useIsWide();
  const member = isMember(state, community.id);
  const join = useDomainJoin(community);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const list = communityEvents(state, now, community.id);
  const closedToMe = !!community.emailDomain && !member;

  const joinOpen = async () => {
    setBusy(true);
    const ok = await joinCommunity(community);
    setBusy(false);
    if (!ok) setError(t('community.page.joinFailed'));
  };

  const access = community.mine
    ? `${community.emailDomain ? t('community.meta.onlyDomain', { domain: community.emailDomain }) : t('community.page.accessOpen')} · ${t('community.page.accessMine')}`
    : community.emailDomain
      ? member
        ? `${t('community.meta.onlyDomain', { domain: community.emailDomain })} ✓`
        : t('community.page.accessDomain', { domain: community.emailDomain })
      : t('community.page.accessOpen');

  let footer: ReactNode;
  if (community.mine)
    footer = <Button label={t('community.page.addEvent')} onPress={() => router.push({ pathname: '/community/[id]/new-event', params: { id: community.id } })} />;
  else if (!member && community.emailDomain)
    footer = <Button label={join.action.label} onPress={join.action.onPress} disabled={join.action.disabled} loading={join.action.loading} />;
  else if (!member) footer = <Button label={t('community.page.join')} onPress={joinOpen} disabled={busy} loading={busy} />;
  else footer = <Button label={t('community.page.leave')} variant="ghost" onPress={() => dispatch({ type: 'leaveCommunity', communityId: community.id })} />;

  return (
    <Screen footer={footer} keyboard backdrop={!wide && <Glow blobs={glows.community} />} contentStyle={wide && styles.wide}>
      <PageHead
        title={community.name}
        sub={community.description || undefined}
        right={
          community.mine ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('community.page.settings')}
              hitSlop={12}
              onPress={() => router.push({ pathname: '/community/[id]/settings', params: { id: community.id } })}
            >
              <SlidersHorizontal size={22} color={c.text} strokeWidth={2} />
            </Pressable>
          ) : undefined
        }
      />

      <View style={styles.head}>
        <CommunityAvatar community={community} size={88} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{communityCounts(community)}</Text>
          <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{access}</Text>
          {member && !community.mine && <Pill label={t('community.page.joined')} tone="accent" style={styles.pill} />}
        </View>
      </View>

      {closedToMe && join.form}
      {error && <Text style={[type.footnote, { color: c.danger }]}>{error}</Text>}

      <Text style={[display(16, 20), { color: c.text, marginTop: 4 }]}>{t('community.page.upcoming')}</Text>
      {list.length ? (
        <View>
          {list.map((e) => (
            <EventRow key={e.id} event={e} count={goingCount(state, e)} />
          ))}
        </View>
      ) : (
        <Text style={[onest('regular', 14, 19), { color: c.muted }]}>
          {community.mine
            ? t('community.page.noEventsMine')
            : closedToMe
              ? t('community.page.eventsLocked', { domain: community.emailDomain! })
              : t('community.page.noEvents')}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pill: { alignSelf: 'flex-start', marginTop: 2 },
});
