import { router } from 'expo-router';
import { Globe, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getInterest, goesWithOptions, vibes } from '@/data/mock';
import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { communityMeta } from '@/components/community/text';
import { myCommunities, verifiedCommunity } from '@/lib/selectors';
import { withHandle } from '@/lib/username';
import { LANGS, useT, type Lang } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { display, onest, useTheme } from '@/theme';

import { accentText } from './names';
import {
  AppearanceSection,
  ConfirmRow,
  DemoSection,
  NotificationsSection,
  Section,
  StatsCard,
  VerifiedPill,
  VisibilitySection,
} from './ProfileSections';
import { Group, Row } from './Rows';

// W09: wide-web profile — profile card, stats, scenes and account on the left; visibility, notifications, safety,
// appearance and the demo clock on the right.
export function WideProfile() {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <View style={styles.titleRow}>
        <Text style={[display(30, 38), { color: c.text }]}>{t('common.tabs.profile')}</Text>
        {/* No settings button here: W09 already carries every row of the phone settings screen. */}
        <LangSwitch />
      </View>
      <View style={styles.columns}>
        <View style={[styles.col, styles.colLeft]}>
          <BigProfileCard />
          <StatsCard />
          <MyCommunities />
          <WideAccount />
        </View>
        <View style={[styles.col, styles.colRight]}>
          <VisibilitySection whoSees />
          <NotificationsSection />
          <WideSafety />
          <AppearanceSection />
          <DemoSection />
        </View>
      </View>
    </ScrollView>
  );
}

// W09: small «UA | EN» segmented switch in the title row.
const LANG_CODES: Record<Lang, string> = { uk: 'UA', en: 'EN' };

function LangSwitch() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { dispatch } = useStore();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('profile.wide.languageSwitch')} style={[styles.lang, { backgroundColor: c.surface }]}>
      <View style={styles.langIcon}>
        <Globe size={16} color={c.muted} strokeWidth={2} />
      </View>
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            accessibilityRole="radio"
            accessibilityLabel={l.native}
            accessibilityState={{ selected: on }}
            onPress={() => dispatch({ type: 'setLanguage', language: l.id })}
            style={[styles.langSeg, on && { backgroundColor: c.surface2 }]}
          >
            <Text style={[onest('semibold', 13), { color: on ? c.text : c.muted }]}>{LANG_CODES[l.id]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BigProfileCard() {
  const { c } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const me = state.me;
  if (!me) return null;
  const vibe = vibes.find((v) => v.id === state.vibe);
  const goes = goesWithOptions.find((g) => g.id === state.goesWith);
  const tags = [
    ...state.interests.map(getInterest).filter((i) => !!i).map((i) => `${i.emoji} ${i.label}`),
    vibe && `${vibe.emoji} ${vibe.label}`,
    goes && `${goes.emoji} ${goes.label}`,
  ].filter((tag): tag is string => !!tag);
  const meta = withHandle(me.username, me.affiliation, state.email);
  const verified = verifiedCommunity(state);
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={72} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.nameRow}>
            <Text style={[display(22, 28), { color: c.text, flexShrink: 1 }]} numberOfLines={1}>
              {me.name}
            </Text>
            {verified && <VerifiedPill label={verified.name} />}
          </View>
          {!!meta && <Text style={[onest('regular', 14, 18), { color: c.muted }]}>{meta}</Text>}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/edit-profile')}
          style={({ hovered }: { hovered?: boolean }) => [styles.edit, { borderColor: c.line }, hovered && { backgroundColor: c.surface2 }]}
        >
          <Text style={[onest('semibold', 14, 18), { color: c.text }]}>{t('profile.wide.edit')}</Text>
        </Pressable>
      </View>
      {!!me.talkAbout && (
        <View style={[styles.talk, { backgroundColor: c.bg }]}>
          <Text style={[onest('medium', 12, 15), { color: c.muted }]}>{t('profile.wide.talkAbout')}</Text>
          <Text style={[onest('semibold', 15, 20), { color: c.text }]}>{me.talkAbout}</Text>
        </View>
      )}
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: c.surface2 }]}>
              <Text style={[onest('medium', 12, 15), { color: c.text }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MyCommunities() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const mine = myCommunities(state);
  return (
    <Section label={t('profile.wide.myCommunities')}>
      <Group>
        {mine.map((cm) => (
          <Pressable
            key={cm.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: cm.id } })}
            style={({ pressed }) => [styles.sceneRow, { borderBottomWidth: 1, borderBottomColor: c.line }, pressed && { backgroundColor: c.surface2 }]}
          >
            <CommunityAvatar community={cm} size={32} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{cm.name}</Text>
              <Text style={[onest('regular', 12, 15), { color: c.muted }]}>{communityMeta(cm, true)}</Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/communities')}
          style={({ pressed }) => [styles.sceneRow, pressed && { backgroundColor: c.surface2 }]}
        >
          <View style={[styles.sceneDot, styles.addDot, { borderColor: accentText(c, scheme) }]}>
            <Plus size={16} color={accentText(c, scheme)} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[onest('semibold', 15, 19), { color: accentText(c, scheme) }]}>{t('profile.wide.findCommunity')}</Text>
            <Text style={[onest('regular', 12, 15), { color: c.muted }]}>{t('profile.wide.findCommunitySub')}</Text>
          </View>
        </Pressable>
      </Group>
    </Section>
  );
}

function WideAccount() {
  const { t } = useT();
  const { c } = useTheme();
  const { dispatch, deleteAccount } = useStore();
  const [confirm, setConfirm] = useState<null | 'logout' | 'delete'>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  return (
    <Section label={t('profile.account.label')}>
      <Group>
        {confirm === 'logout' ? (
          <ConfirmRow question={t('profile.account.logoutQuestion')} confirmLabel={t('profile.account.logout')} onCancel={() => setConfirm(null)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <Row label={t('profile.account.logout')} destructive chevron onPress={() => setConfirm('logout')} />
        )}
        {confirm === 'delete' ? (
          <>
            <ConfirmRow
              question={t('profile.account.deleteQuestion')}
              confirmLabel={t('profile.account.delete')}
              onCancel={() => setConfirm(null)}
              onConfirm={() => {
                setDeleteFailed(false);
                deleteAccount().then((ok) => !ok && setDeleteFailed(true));
              }}
            />
            {deleteFailed && <Text style={[onest('medium', 13, 17), styles.deleteError, { color: c.danger }]}>{t('profile.account.deleteFailed')}</Text>}
          </>
        ) : (
          <Row
            label={t('profile.account.deleteAccount')}
            sub={t('profile.account.deleteAccountSub')}
            destructive
            chevron
            onPress={() => setConfirm('delete')}
          />
        )}
        <Row last label={t('profile.settings.version')} value="0.1 beta" />
      </Group>
    </Section>
  );
}

function WideSafety() {
  const { t } = useT();
  const { state } = useStore();
  const blocked = Object.keys(state.blocked).length;
  return (
    <Section label={t('profile.safety.label')}>
      <Group>
        <Row
          label={t('profile.safety.blocked')}
          sub={t('profile.safety.blockedSub')}
          value={blocked ? String(blocked) : undefined}
          chevron
          onPress={() => router.push('/blocked')}
        />
        <Row label={t('profile.safety.rules')} chevron onPress={() => router.push('/rules')} />
        <Row last label={t('profile.safety.howReports')} sub={t('profile.safety.howReportsSub')} chevron onPress={() => router.push('/rules')} />
      </Group>
    </Section>
  );
}

// W09 geometry: 48 pt page inset, 30 pt title, 500 + 560 pt columns 40 pt apart, 16 pt column gap.
const styles = StyleSheet.create({
  deleteError: { paddingHorizontal: 16, paddingBottom: 12 },
  page: { paddingHorizontal: 48, paddingTop: 36, paddingBottom: 48, gap: 24, maxWidth: 1196 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  lang: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4, borderRadius: 14 },
  langIcon: { paddingLeft: 8, paddingRight: 4 },
  langSeg: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  columns: { flexDirection: 'row', gap: 40, alignItems: 'flex-start' },
  col: { flexBasis: 0, gap: 16 },
  colLeft: { flexGrow: 500 },
  colRight: { flexGrow: 560 },
  card: { borderRadius: 22, padding: 20, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  edit: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  talk: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  primary: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  sceneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  sceneDot: { width: 32, height: 32, borderRadius: 16 },
  addDot: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
