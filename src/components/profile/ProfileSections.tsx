import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Chip, List, ListRow, Segmented, SectionLabel, Toggle } from '@/components/ui';
import { getScene } from '@/data/mock';
import { useT } from '@/i18n';
import { pendingSurveys, profileStats } from '@/lib/selectors';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme, type ThemeMode } from '@/theme';

import { demoMode, demoOffsetFor, demoTarget, type DemoMode } from './demo';
import { accentText } from './names';

// Building blocks shared by M16 «Профіль», M16b «Налаштування» and the two-column W09 web profile.

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </View>
  );
}

// Small soft-accent pill: «УКУ ✓» / «UCU ✓».
export function VerifiedPill({ label }: { label: string }) {
  const { c, scheme } = useTheme();
  return (
    <View style={[styles.verified, { backgroundColor: c.accentSoft }]}>
      <Text style={[onest('semibold', 12), { color: accentText(c, scheme) }]}>{label} ✓</Text>
    </View>
  );
}

const campusName = () => getScene('ucu').name;

export function ProfileCard() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const me = state.me;
  if (!me) return null;
  return (
    <View style={[styles.card, styles.profile, { backgroundColor: c.surface }]}>
      <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={64} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={styles.nameRow}>
          <Text style={[onest('bold', 17), { color: c.text, flexShrink: 1 }]} numberOfLines={1}>
            {me.name}
          </Text>
          {state.studentEmail && <VerifiedPill label={campusName()} />}
        </View>
        {!!me.affiliation && <Text style={[type.footnote, { color: c.muted }]}>{me.affiliation}</Text>}
        {!!me.talkAbout && <Text style={[type.footnote, { color: c.text }]}>«{me.talkAbout}»</Text>}
      </View>
      <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/edit-profile')}>
        <Text style={[onest('semibold', 14), { color: accentText(c, scheme) }]}>{t('profile.edit')}</Text>
      </Pressable>
    </View>
  );
}

export function StatsCard() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const now = useNow();
  const s = profileStats(state, now);
  const cols = [
    { key: 'events', n: s.attended, label: t('profile.stats.events', { count: s.attended }) },
    { key: 'newPeople', n: s.newPeople, label: t('profile.stats.newPeople', { count: s.newPeople }), accent: true },
    { key: 'contacts', n: s.contacts, label: t('profile.stats.contacts', { count: s.contacts }) },
  ];
  return (
    <View style={[styles.card, styles.stats, { backgroundColor: c.surface, borderColor: c.line }]}>
      {cols.map((col) => (
        <View key={col.key} style={styles.stat}>
          <Text style={[display(24, 30), { color: col.accent ? accentText(c, scheme) : c.text }]}>{col.n}</Text>
          <Text style={[type.footnote, { color: c.muted }]} numberOfLines={1}>
            {col.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function VisibilitySection() {
  const { t } = useT();
  const { state, dispatch } = useStore();
  const { showSolo, showSharedEvents } = state.settings;
  return (
    <Section label={t('profile.visibility.label')}>
      <List>
        <ListRow
          label={t('profile.visibility.showSolo')}
          sub={t('profile.visibility.showSoloSub')}
          right={<Toggle value={showSolo} accessibilityLabel={t('profile.visibility.showSolo')} onChange={(v) => dispatch({ type: 'setPrivacy', key: 'showSolo', value: v })} />}
        />
        <ListRow
          last
          label={t('profile.visibility.showShared')}
          sub={t('profile.visibility.showSharedSub')}
          right={
            <Toggle
              value={showSharedEvents}
              accessibilityLabel={t('profile.visibility.showShared')}
              onChange={(v) => dispatch({ type: 'setPrivacy', key: 'showSharedEvents', value: v })}
            />
          }
        />
      </List>
    </Section>
  );
}

export function SafetySection() {
  const { t } = useT();
  const { state } = useStore();
  const blocked = Object.keys(state.blocked).length;
  return (
    <Section label={t('profile.safety.label')}>
      <List>
        <ListRow label={t('profile.safety.blocked')} value={blocked ? String(blocked) : undefined} chevron onPress={() => router.push('/blocked')} />
        <ListRow last label={t('profile.safety.rules')} chevron onPress={() => router.push('/rules')} />
      </List>
    </Section>
  );
}

// Inline destructive confirmation that replaces the row it was opened from.
export function ConfirmRow({ question, confirmLabel, onConfirm, onCancel }: { question: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={styles.confirm}>
      <Text style={[type.subheadStrong, { color: c.text, flex: 1 }]}>{question}</Text>
      <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.confirmBtn, { backgroundColor: c.surface2 }]}>
        <Text style={[onest('semibold', 14), { color: c.text }]}>{t('common.cancel')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onConfirm} style={[styles.confirmBtn, { backgroundColor: c.danger }]}>
        <Text style={[onest('semibold', 14), { color: '#FFFFFF' }]}>{confirmLabel}</Text>
      </Pressable>
    </View>
  );
}

export function AccountSection({ confirming, setConfirming }: { confirming: boolean; setConfirming: (v: boolean) => void }) {
  const { t } = useT();
  const { state, dispatch } = useStore();
  const scene = state.sceneId ? getScene(state.sceneId) : null;
  return (
    <Section label={t('profile.account.label')}>
      <List>
        <ListRow label={t('profile.account.preferences')} value={scene?.name} chevron onPress={() => router.push('/preferences')} />
        {confirming ? (
          <ConfirmRow
            question={t('profile.account.logoutQuestion')}
            confirmLabel={t('profile.account.logout')}
            onCancel={() => setConfirming(false)}
            onConfirm={() => dispatch({ type: 'logout' })}
          />
        ) : (
          <ListRow last label={t('profile.account.logout')} destructive onPress={() => setConfirming(true)} />
        )}
      </List>
    </Section>
  );
}

const themeModes: ThemeMode[] = ['dark', 'light', 'system'];

export function AppearanceSection() {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const themeOptions = themeModes.map((key) => ({ key, label: t(`profile.appearance.${key}`) }));
  return (
    <Section label={t('profile.appearance.label')}>
      <View style={[styles.segWrap, { backgroundColor: c.surface }]}>
        <Segmented
          options={themeOptions}
          value={state.settings.theme}
          onChange={(theme) => dispatch({ type: 'setTheme', theme })}
          style={{ backgroundColor: c.bg }}
        />
      </View>
    </Section>
  );
}

export function NotificationsSection() {
  const { t } = useT();
  const { state, dispatch } = useStore();
  const n = state.settings.notify;
  const row = (key: keyof typeof n, label: string, sub?: string, last?: boolean) => (
    <ListRow
      key={key}
      label={label}
      sub={sub}
      last={last}
      right={<Toggle value={n[key]} accessibilityLabel={label} onChange={(value) => dispatch({ type: 'setNotify', key, value })} />}
    />
  );
  return (
    <Section label={t('profile.notifications.label')}>
      <List>
        {row('soloOnMyEvent', t('profile.notifications.soloOnMyEvent'))}
        {row('albumOpened', t('profile.notifications.albumOpened'))}
        {row('newSceneEvents', t('profile.notifications.newSceneEvents'), t('profile.notifications.newSceneEventsSub'), true)}
      </List>
    </Section>
  );
}

const demoModes: DemoMode[] = ['now', 'live', 'after'];

// Not in Figma: a demo clock to preview the live and after-event states without waiting for real time.
export function DemoSection() {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const now = useNow();
  const demoChips = demoModes.map((key) => ({ key, label: t(`profile.demo.${key}`) }));
  const [resetting, setResetting] = useState(false);
  const target = demoTarget(state);
  const mode = demoMode(state, target);
  const survey = pendingSurveys(state, now)[0];
  return (
    <Section label={t('profile.demo.label')}>
      <View style={[styles.card, styles.demo, { backgroundColor: c.surface }]}>
        <View style={styles.chips}>
          {demoChips.map((d) => (
            <Chip key={d.key} label={d.label} selected={mode === d.key} onPress={() => dispatch({ type: 'setDemoOffset', ms: demoOffsetFor(d.key, target) })} />
          ))}
        </View>
        <Text style={[type.footnote, { color: c.muted }]}>
          {t('profile.demo.hint', { title: target.title })}
        </Text>
      </View>
      <List>
        {survey && (
          <ListRow label={t('profile.demo.openSurvey')} sub={survey.title} chevron onPress={() => router.push({ pathname: '/event/[id]/after', params: { id: survey.id } })} />
        )}
        {resetting ? (
          <ConfirmRow question={t('profile.demo.resetQuestion')} confirmLabel={t('profile.demo.reset')} onCancel={() => setResetting(false)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <ListRow last label={t('profile.demo.resetDemo')} destructive onPress={() => setResetting(true)} />
        )}
      </List>
    </Section>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  card: { borderRadius: 20 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verified: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  stats: { flexDirection: 'row', paddingVertical: 14, borderWidth: 1 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingHorizontal: 16, paddingVertical: 10 },
  confirmBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  segWrap: { borderRadius: 20, padding: 8 },
  demo: { padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
