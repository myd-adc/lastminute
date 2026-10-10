import { Bell, Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Gradient, Toggle } from '@/components/ui';
import { events, PAST_EVENT_IDS, scenes } from '@/data/mock';
import type { Scene, SceneId } from '@/data/types';
import { useT } from '@/i18n';
import { DAY, eventsCount, people } from '@/lib/time';
import { useNow } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

import { accentInk, TextField } from './kit';

export const STUDENT_DOMAIN = '@ucu.edu.ua';
export const isStudentEmail = (s: string) => /^[^\s@]+@ucu\.edu\.ua$/i.test(s.trim());

// Upcoming events of a scene within the next 7 days («6 подій цього тижня»).
export const sceneWeekEvents = (sceneId: SceneId, now: number) =>
  events.filter(
    (e) => e.sceneId === sceneId && !PAST_EVENT_IDS.includes(e.id) && Date.parse(e.endsAt) > now && Date.parse(e.startsAt) < now + 7 * DAY,
  ).length;

export type SceneDraft = { sceneId: SceneId | null; studentEmail: string | null };

export const sceneValid = (d: SceneDraft) => {
  const scene = scenes.find((s) => s.id === d.sceneId);
  return !!scene && (!scene.requiresStudentEmail || !!d.studentEmail);
};

// M05 scene picker, shared by onboarding (scene-select) and «Вподобання і сцени».
export function SceneForm({ value, onChange }: { value: SceneDraft; onChange: (v: SceneDraft) => void }) {
  return (
    <View style={{ gap: 12 }}>
      {scenes.map((s) => (
        <SceneCard
          key={s.id}
          scene={s}
          selected={value.sceneId === s.id}
          verifiedEmail={value.studentEmail}
          onSelect={() => onChange({ ...value, sceneId: s.id })}
          onVerify={(email) => onChange({ sceneId: s.id, studentEmail: email })}
        />
      ))}
    </View>
  );
}

function SceneCard({
  scene,
  selected,
  verifiedEmail,
  onSelect,
  onVerify,
}: {
  scene: Scene;
  selected: boolean;
  verifiedEmail: string | null;
  onSelect: () => void;
  onVerify: (email: string) => void;
}) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const now = useNow();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const needsEmail = scene.requiresStudentEmail && !verifiedEmail;
  const ink = accentInk(c, scheme);

  const submit = () => {
    if (isStudentEmail(email)) {
      setError(false);
      onVerify(email.trim().toLowerCase());
    } else setError(true);
  };

  let sub: string;
  if (scene.requiresStudentEmail)
    sub = verifiedEmail
      ? `${scene.description} ✓ · ${people(scene.people)} · ${eventsCount(sceneWeekEvents(scene.id, now))}`
      : t('onboarding.scene.needsEmail', { domain: STUDENT_DOMAIN, people: people(scene.people) });
  else sub = scene.kind === 'venue' ? `${scene.description} ${people(scene.people)}` : scene.description;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: selected ? c.accent : c.line, borderWidth: selected ? 1.5 : 1 },
      ]}
    >
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onSelect} style={styles.row}>
        <Gradient id={scene.gradient} style={styles.dot} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[onest('bold', 16), { color: c.text }]}>
            {scene.emoji ? `${scene.emoji} ` : ''}
            {scene.name}
          </Text>
          <Text style={[type.footnote, { color: scene.requiresStudentEmail && verifiedEmail ? ink : c.muted }]}>{sub}</Text>
        </View>
        {selected ? (
          <View style={[styles.check, { backgroundColor: c.accent }]}>
            <Check size={15} color={c.onAccent} strokeWidth={3} />
          </View>
        ) : (
          <View style={[styles.check, { borderWidth: 1.5, borderColor: c.line }]} />
        )}
      </Pressable>

      {selected && needsEmail && (
        <View style={styles.email}>
          <TextField
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(false);
            }}
            placeholder={t('onboarding.scene.emailPlaceholder', { domain: STUDENT_DOMAIN })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel={t('onboarding.scene.emailA11y')}
            boxStyle={{ backgroundColor: c.bg, minHeight: 48, paddingRight: 6 }}
            right={
              <Pressable
                accessibilityRole="button"
                onPress={submit}
                disabled={!email.trim()}
                style={[styles.verify, { backgroundColor: c.accent, opacity: email.trim() ? 1 : 0.4 }]}
              >
                <Text style={[onest('bold', 14), { color: c.onAccent }]}>{t('onboarding.scene.verify')}</Text>
              </Pressable>
            }
          />
          <Text style={[type.footnote, { color: error ? c.danger : c.muted }]}>
            {error ? t('onboarding.scene.emailError', { domain: STUDENT_DOMAIN }) : t('onboarding.scene.emailHint')}
          </Text>
        </View>
      )}
    </View>
  );
}

// «Сповіщення» card with the accent toggle (M05).
export function NotifyCard({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  return (
    <View style={[styles.notify, { backgroundColor: c.surface }]}>
      <Bell size={20} color={accentInk(c, scheme)} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[onest('bold', 16), { color: c.text }]}>{t('onboarding.scene.notify')}</Text>
        <Text style={[type.footnote, { color: c.muted }]}>
          {t('onboarding.scene.notifyText')}
        </Text>
      </View>
      <Toggle value={value} onChange={onChange} accessibilityLabel={t('onboarding.scene.notify')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  dot: { width: 44, height: 44, borderRadius: 22 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  email: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  verify: { height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notify: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18 },
});
