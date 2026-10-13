import { router } from 'expo-router';
import { Globe, Plus, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Gradient } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getInterest, getScene, goesWithOptions, vibes } from '@/data/mock';
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
        <View style={styles.titleActions}>
          <LangSwitch />
          {/* Not in W09: compact entry to the full settings (email, student email, version). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.settingsTitle')}
            onPress={() => router.push('/settings')}
            style={({ hovered }: { hovered?: boolean }) => [styles.settingsBtn, { backgroundColor: hovered ? c.surface2 : c.surface }]}
          >
            <Settings size={18} color={c.muted} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
      <View style={styles.columns}>
        <View style={[styles.col, styles.colLeft]}>
          <BigProfileCard />
          <StatsCard />
          <MyScenes />
          <WideAccount />
        </View>
        <View style={[styles.col, styles.colRight]}>
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
  const meta = [me.affiliation, state.email].filter(Boolean).join(' · ');
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={72} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.nameRow}>
            <Text style={[display(22, 28), { color: c.text, flexShrink: 1 }]} numberOfLines={1}>
              {me.name}
            </Text>
            {state.studentEmail && <VerifiedPill label={getScene('ucu').name} />}
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

function MyScenes() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const scene = state.sceneId ? getScene(state.sceneId) : null;
  return (
    <Section label={t('profile.wide.myScenes')}>
      <Group>
        {scene && (
          <View style={[styles.sceneRow, { borderBottomWidth: 1, borderBottomColor: c.line }]}>
            <Gradient id={scene.gradient} style={styles.sceneDot} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{scene.name}</Text>
              <Text style={[onest('regular', 12, 15), { color: c.muted }]}>
                {scene.requiresStudentEmail && state.studentEmail ? t('profile.wide.studentVerified') : scene.description}
              </Text>
            </View>
            <View style={[styles.primary, { backgroundColor: c.accent }]}>
              <Text style={[onest('bold', 12, 15), { color: c.onAccent }]}>{t('profile.wide.primary')}</Text>
            </View>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/preferences')}
          style={({ pressed }) => [styles.sceneRow, pressed && { backgroundColor: c.surface2 }]}
        >
          <View style={[styles.sceneDot, styles.addDot, { borderColor: accentText(c, scheme) }]}>
            <Plus size={16} color={accentText(c, scheme)} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[onest('semibold', 15, 19), { color: accentText(c, scheme) }]}>{t('profile.wide.changeScene')}</Text>
            <Text style={[onest('regular', 12, 15), { color: c.muted }]}>{t('profile.wide.changeSceneSub')}</Text>
          </View>
        </Pressable>
      </Group>
    </Section>
  );
}

function WideAccount() {
  const { t } = useT();
  const { dispatch } = useStore();
  const [confirm, setConfirm] = useState<null | 'logout' | 'delete'>(null);
  return (
    <Section label={t('profile.account.label')}>
      <Group>
        {confirm === 'logout' ? (
          <ConfirmRow question={t('profile.account.logoutQuestion')} confirmLabel={t('profile.account.logout')} onCancel={() => setConfirm(null)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <Row label={t('profile.account.logout')} destructive chevron onPress={() => setConfirm('logout')} />
        )}
        {confirm === 'delete' ? (
          <ConfirmRow question={t('profile.account.deleteQuestion')} confirmLabel={t('profile.account.delete')} onCancel={() => setConfirm(null)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <Row
            last
            label={t('profile.account.deleteAccount')}
            sub={t('profile.account.deleteAccountSub')}
            destructive
            chevron
            onPress={() => setConfirm('delete')}
          />
        )}
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
  page: { paddingHorizontal: 48, paddingTop: 36, paddingBottom: 48, gap: 24, maxWidth: 1196 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lang: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 4, borderRadius: 14 },
  langIcon: { paddingLeft: 8, paddingRight: 4 },
  langSeg: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsBtn: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
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
