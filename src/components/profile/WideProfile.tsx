import { router } from 'expo-router';
import { Globe, Plus, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, Gradient, List, ListRow, Pill } from '@/components/ui';
import { getInterest, getScene, goesWithOptions, vibes } from '@/data/mock';
import { LANGS, useT, type Lang } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

import { accentText, maskPhone } from './names';
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

// W09: wide-web profile — profile card, stats, scenes and account on the left; visibility, notifications, safety,
// appearance and the demo clock on the right.
export function WideProfile() {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={styles.page}>
      <View style={styles.titleRow}>
        <Text style={[display(36, 44), { color: c.text }]}>{t('common.tabs.profile')}</Text>
        <View style={styles.titleActions}>
          <LangSwitch />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={({ hovered }: { hovered?: boolean }) => [styles.settingsBtn, { backgroundColor: hovered ? c.surface2 : c.surface }]}
          >
            <Settings size={18} color={c.text} strokeWidth={2} />
            <Text style={[onest('semibold', 14), { color: c.text }]}>{t('profile.settingsTitle')}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.columns}>
        <View style={styles.col}>
          <BigProfileCard />
          <StatsCard />
          <MyScenes />
          <WideAccount />
        </View>
        <View style={styles.col}>
          <VisibilitySection />
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
      <Globe size={16} color={c.muted} strokeWidth={2} style={{ marginHorizontal: 8 }} />
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
  const meta = [me.affiliation, state.phone && maskPhone(state.phone)].filter(Boolean).join(' · ');
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={72} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.nameRow}>
            <Text style={[display(24, 30), { color: c.text, flexShrink: 1 }]} numberOfLines={1}>
              {me.name}
            </Text>
            {state.studentEmail && <VerifiedPill label={getScene('ucu').name} />}
          </View>
          {!!meta && <Text style={[type.subhead, { color: c.muted }]}>{meta}</Text>}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/edit-profile')}
          style={({ hovered }: { hovered?: boolean }) => [styles.edit, { borderColor: c.line }, hovered && { backgroundColor: c.surface2 }]}
        >
          <Text style={[onest('semibold', 14), { color: c.text }]}>{t('profile.edit')}</Text>
        </Pressable>
      </View>
      {!!me.talkAbout && (
        <View style={[styles.talk, { backgroundColor: c.bg }]}>
          <Text style={[type.caption, { color: c.muted }]}>{t('profile.wide.talkAbout')}</Text>
          <Text style={[onest('semibold', 15, 20), { color: c.text }]}>{me.talkAbout}</Text>
        </View>
      )}
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Pill key={tag} label={tag} weight="medium" />
          ))}
        </View>
      )}
    </View>
  );
}

function MyScenes() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const scene = state.sceneId ? getScene(state.sceneId) : null;
  return (
    <Section label={t('profile.wide.myScenes')}>
      <List>
        {scene && (
          <View style={[styles.sceneRow, { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <Gradient id={scene.gradient} style={styles.sceneDot} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[onest('medium', 16), { color: c.text }]}>{scene.name}</Text>
              <Text style={[type.footnote, { color: c.muted }]}>
                {scene.requiresStudentEmail && state.studentEmail ? t('profile.wide.studentVerified') : scene.description}
              </Text>
            </View>
            <Pill label={t('profile.wide.primary')} tone="accent" />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/preferences')}
          style={({ pressed }) => [styles.sceneRow, pressed && { backgroundColor: c.surface2 }]}
        >
          <View style={[styles.sceneDot, styles.addDot, { borderColor: accentText(c, scheme) }]}>
            <Plus size={14} color={accentText(c, scheme)} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[onest('medium', 16), { color: accentText(c, scheme) }]}>{t('profile.wide.changeScene')}</Text>
            <Text style={[type.footnote, { color: c.muted }]}>{t('profile.wide.changeSceneSub')}</Text>
          </View>
        </Pressable>
      </List>
    </Section>
  );
}

function WideAccount() {
  const { t } = useT();
  const { dispatch } = useStore();
  const [confirm, setConfirm] = useState<null | 'logout' | 'delete'>(null);
  return (
    <Section label={t('profile.account.label')}>
      <List>
        {confirm === 'logout' ? (
          <ConfirmRow question={t('profile.account.logoutQuestion')} confirmLabel={t('profile.account.logout')} onCancel={() => setConfirm(null)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <ListRow label={t('profile.account.logout')} destructive chevron onPress={() => setConfirm('logout')} />
        )}
        {confirm === 'delete' ? (
          <ConfirmRow question={t('profile.account.deleteQuestion')} confirmLabel={t('profile.account.delete')} onCancel={() => setConfirm(null)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <ListRow
            last
            label={t('profile.account.deleteAccount')}
            sub={t('profile.account.deleteAccountSub')}
            destructive
            chevron
            onPress={() => setConfirm('delete')}
          />
        )}
      </List>
    </Section>
  );
}

function WideSafety() {
  const { t } = useT();
  const { state } = useStore();
  const blocked = Object.keys(state.blocked).length;
  return (
    <Section label={t('profile.safety.label')}>
      <List>
        <ListRow
          label={t('profile.safety.blocked')}
          sub={t('profile.safety.blockedSub')}
          value={blocked ? String(blocked) : undefined}
          chevron
          onPress={() => router.push('/blocked')}
        />
        <ListRow label={t('profile.safety.rules')} chevron onPress={() => router.push('/rules')} />
        <ListRow last label={t('profile.safety.howReports')} sub={t('profile.safety.howReportsSub')} chevron onPress={() => router.push('/rules')} />
      </List>
    </Section>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 48, paddingTop: 36, paddingBottom: 48, gap: 28, maxWidth: 1200 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lang: { flexDirection: 'row', alignItems: 'center', height: 40, padding: 4, gap: 2, borderRadius: 14 },
  langSeg: { height: 32, minWidth: 44, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 14 },
  columns: { flexDirection: 'row', gap: 40, alignItems: 'flex-start' },
  col: { flex: 1, gap: 20 },
  card: { borderRadius: 24, padding: 20, gap: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  edit: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  talk: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sceneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 16, paddingVertical: 12 },
  sceneDot: { width: 32, height: 32, borderRadius: 16 },
  addDot: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
