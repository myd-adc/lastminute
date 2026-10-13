import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Chip, Toggle } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { myCommunities, pendingSurveys, profileStats, verifiedCommunity } from '@/lib/selectors';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme, type ThemeMode } from '@/theme';

import { demoMode, demoOffsetFor, demoTarget, type DemoMode } from './demo';
import { accentText } from './names';
import { Group, GroupLabel, Row } from './Rows';

// Building blocks shared by M16 «Профіль», M16b «Налаштування» and the two-column W09 web profile.
// A section is a caption plus its group as siblings, so the parent column's gap spaces them exactly as the frames do
// (12 pt in M16, 7 pt in M16b, 16 pt in W09).

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      {children}
    </>
  );
}

// Small soft-accent pill: «УКУ ✓» / «UCU ✓» (Figma «Pill»: 10×5 padding, radius 12, SemiBold 12).
export function VerifiedPill({ label }: { label: string }) {
  const { c, scheme } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: c.accentSoft }]}>
      <Text style={[onest('semibold', 12), { color: accentText(c, scheme) }]}>{label} ✓</Text>
    </View>
  );
}

// M16 profile card: 14 pt padding, 60 pt avatar, name Onest Bold 17, «Змінити» SemiBold 13 in accent.
export function ProfileCard() {
  const { c, scheme } = useTheme();
  const { t, lang } = useT();
  const { state } = useStore();
  const me = state.me;
  if (!me) return null;
  const verified = verifiedCommunity(state);
  return (
    <View style={[styles.profile, { backgroundColor: c.surface }]}>
      <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={60} />
      <View style={styles.profileText}>
        <View style={styles.nameRow}>
          <Text style={[onest('bold', 17, 22), { color: c.text, flexShrink: 1 }]} numberOfLines={1}>
            {me.name}
          </Text>
          {verified && <VerifiedPill label={verified.name} />}
        </View>
        {!!me.affiliation && <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{me.affiliation}</Text>}
        {!!me.talkAbout && <Text style={[onest('medium', 13, 17), { color: c.text }]}>{lang === 'uk' ? `«${me.talkAbout}»` : `“${me.talkAbout}”`}</Text>}
      </View>
      <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/edit-profile')}>
        <Text style={[onest('semibold', 13), { color: accentText(c, scheme) }]}>{t('profile.edit')}</Text>
      </Pressable>
    </View>
  );
}

// Outlined stats strip (no fill): M16 — 12 pt vertical padding, Unbounded 20 / Onest 12; W09 — 16 pt, 24 / 13.
export function StatsCard() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state } = useStore();
  const now = useNow();
  const wide = useIsWide();
  const s = profileStats(state, now);
  const cols = [
    { key: 'events', n: s.attended, label: t('profile.stats.events', { count: s.attended }) },
    { key: 'newPeople', n: s.newPeople, label: t('profile.stats.newPeople', { count: s.newPeople }), accent: true },
    { key: 'contacts', n: s.contacts, label: t('profile.stats.contacts', { count: s.contacts }) },
  ];
  // W09 adds a fourth column; the 350 pt phone strip keeps three.
  if (wide) {
    const n = myCommunities(state).length;
    cols.push({ key: 'communities', n, label: t('profile.stats.communities', { count: n }) });
  }
  return (
    <View style={[styles.stats, wide && styles.statsWide, { borderColor: c.line }]}>
      {cols.map((col) => (
        <View key={col.key} style={styles.stat}>
          <Text style={[wide ? display(24, 30) : display(20, 25), { letterSpacing: 0, color: col.accent ? accentText(c, scheme) : c.text }]}>{col.n}</Text>
          <Text style={[onest('regular', wide ? 13 : 12, wide ? 17 : 15), { color: c.muted }]} numberOfLines={1}>
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
      <Group>
        <Row
          label={t('profile.visibility.showSolo')}
          sub={t('profile.visibility.showSoloSub')}
          right={<Toggle value={showSolo} accessibilityLabel={t('profile.visibility.showSolo')} onChange={(v) => dispatch({ type: 'setPrivacy', key: 'showSolo', value: v })} />}
        />
        <Row
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
      </Group>
    </Section>
  );
}

export function SafetySection() {
  const { t } = useT();
  const { state } = useStore();
  const blocked = Object.keys(state.blocked).length;
  return (
    <Section label={t('profile.safety.label')}>
      <Group>
        <Row label={t('profile.safety.blocked')} value={blocked ? String(blocked) : undefined} chevron onPress={() => router.push('/blocked')} />
        <Row last label={t('profile.safety.rules')} chevron onPress={() => router.push('/rules')} />
      </Group>
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
  const { dispatch } = useStore();
  return (
    <Section label={t('profile.account.label')}>
      <Group>
        <Row label={t('profile.account.preferences')} chevron onPress={() => router.push('/preferences')} />
        {confirming ? (
          <ConfirmRow
            question={t('profile.account.logoutQuestion')}
            confirmLabel={t('profile.account.logout')}
            onCancel={() => setConfirming(false)}
            onConfirm={() => dispatch({ type: 'logout' })}
          />
        ) : (
          <Row last label={t('profile.account.logout')} destructive onPress={() => setConfirming(true)} />
        )}
      </Group>
    </Section>
  );
}

const themeModes: ThemeMode[] = ['dark', 'light', 'system'];

// M16b «Вигляд»: 12 pt card padding around a bg-coloured track (4 pt inset, radius 14), segments 9 pt tall padding,
// radius 10, Onest SemiBold 13.
export function AppearanceSection() {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  return (
    <Section label={t('profile.appearance.label')}>
      <Group style={styles.segWrap}>
        <View accessibilityRole="radiogroup" style={[styles.segTrack, { backgroundColor: c.bg }]}>
          {themeModes.map((key) => {
            const on = state.settings.theme === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => dispatch({ type: 'setTheme', theme: key })}
                style={[styles.seg, on && { backgroundColor: c.surface2 }]}
              >
                <Text style={[onest('semibold', 13, 17), { color: on ? c.text : c.muted }]} numberOfLines={1}>
                  {t(`profile.appearance.${key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Group>
    </Section>
  );
}

export function NotificationsSection({ dense }: { dense?: boolean }) {
  const { t } = useT();
  const { state, dispatch } = useStore();
  const n = state.settings.notify;
  const row = (key: keyof typeof n, label: string, sub?: string, last?: boolean) => (
    <Row
      key={key}
      label={label}
      sub={sub}
      last={last}
      right={<Toggle value={n[key]} accessibilityLabel={label} onChange={(value) => dispatch({ type: 'setNotify', key, value })} />}
    />
  );
  return (
    <Section label={t('profile.notifications.label')}>
      <Group dense={dense}>
        {row('soloOnMyEvent', t('profile.notifications.soloOnMyEvent'))}
        {row('albumOpened', t('profile.notifications.albumOpened'))}
        {row('newCommunityEvents', t('profile.notifications.newCommunityEvents'), t('profile.notifications.newCommunityEventsSub'), true)}
      </Group>
    </Section>
  );
}

const demoModes: DemoMode[] = ['now', 'live', 'after'];

// Not in Figma: a demo clock to preview the live and after-event states without waiting for real time.
export function DemoSection({ dense }: { dense?: boolean }) {
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
      {target && (
        <Group style={styles.demo}>
          <View style={styles.chips}>
            {demoChips.map((d) => (
              <Chip key={d.key} label={d.label} selected={mode === d.key} onPress={() => dispatch({ type: 'setDemoOffset', ms: demoOffsetFor(d.key, target) })} />
            ))}
          </View>
          <Text style={[type.footnote, { color: c.muted }]}>{t('profile.demo.hint', { title: target.title })}</Text>
        </Group>
      )}
      <Group dense={dense}>
        {survey && (
          <Row label={t('profile.demo.openSurvey')} sub={survey.title} chevron onPress={() => router.push({ pathname: '/event/[id]/after', params: { id: survey.id } })} />
        )}
        {resetting ? (
          <ConfirmRow question={t('profile.demo.resetQuestion')} confirmLabel={t('profile.demo.reset')} onCancel={() => setResetting(false)} onConfirm={() => dispatch({ type: 'logout' })} />
        ) : (
          <Row last label={t('profile.demo.resetDemo')} destructive onPress={() => setResetting(true)} />
        )}
      </Group>
    </Section>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20 },
  profileText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stats: { flexDirection: 'row', paddingVertical: 12, borderRadius: 18, borderWidth: 1 },
  statsWide: { paddingVertical: 16, borderRadius: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingHorizontal: 16, paddingVertical: 8 },
  confirmBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  segWrap: { padding: 12 },
  segTrack: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 14 },
  seg: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  demo: { padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
