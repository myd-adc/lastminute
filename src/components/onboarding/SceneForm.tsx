import { Bell, Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { requestStudentEmailCode, verifyStudentEmail } from '@/api/auth';
import { isLive } from '@/api/client';
import { Gradient, Toggle } from '@/components/ui';
import { Text } from '@/components/ui/Text';
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

// Signing in with the campus address already confirms it, so the campus scene needs no extra step.
export const knownStudentEmail = (studentEmail: string | null, loginEmail: string | null) =>
  studentEmail ?? (loginEmail && isStudentEmail(loginEmail) ? loginEmail : null);

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
  // Live backend: a code goes to the address first, and the scene unlocks once the code is confirmed.
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<null | 'emailSend' | 'emailTaken' | 'code'>(null);
  const needsEmail = scene.requiresStudentEmail && !verifiedEmail;
  const ink = accentInk(c, scheme);
  const address = email.trim().toLowerCase();

  const submit = async () => {
    if (!isStudentEmail(email)) return setError(true);
    setError(false);
    if (!isLive) return onVerify(address);
    setBusy(true);
    const res = await requestStudentEmailCode(address);
    setBusy(false);
    if (!res.ok) return setFailure(res.error === 'email_taken' ? 'emailTaken' : 'emailSend');
    setFailure(null);
    setStage('code');
  };

  const confirm = async () => {
    setBusy(true);
    const res = await verifyStudentEmail(address, code.trim());
    setBusy(false);
    if (!res.ok) return setFailure('code');
    setFailure(null);
    onVerify(address);
  };

  const inCode = stage === 'code';
  const action = inCode ? confirm : submit;
  const actionReady = inCode ? code.trim().length >= 6 : !!email.trim();
  const hint = failure
    ? t(failure === 'code' ? 'onboarding.errors.code' : `onboarding.errors.${failure}`)
    : error
      ? t('onboarding.scene.emailError', { domain: STUDENT_DOMAIN })
      : inCode
        ? t('onboarding.scene.codeSent', { email: address })
        : t('onboarding.scene.emailHint');

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
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[onest('bold', 16, 20), { color: c.text }]}>
            {scene.emoji ? `${scene.emoji} ` : ''}
            {scene.name}
          </Text>
          <Text style={[onest('regular', 13, 17.5), { color: scene.requiresStudentEmail && verifiedEmail ? ink : c.muted }]}>{sub}</Text>
        </View>
        {selected ? (
          <View style={[styles.check, { backgroundColor: c.accent }]}>
            <Check size={14} color={c.onAccent} strokeWidth={3} />
          </View>
        ) : (
          <View style={[styles.check, { borderWidth: 1.5, borderColor: c.line }]} />
        )}
      </Pressable>

      {selected && needsEmail && (
        <View style={styles.email}>
          <TextField
            value={inCode ? code : email}
            onChangeText={(text) => {
              if (inCode) setCode(text.replace(/\D/g, '').slice(0, 6));
              else setEmail(text);
              if (error) setError(false);
              if (failure) setFailure(null);
            }}
            placeholder={inCode ? t('onboarding.scene.codePlaceholder') : t('onboarding.scene.emailPlaceholder', { domain: STUDENT_DOMAIN })}
            keyboardType={inCode ? 'number-pad' : 'email-address'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={inCode ? 'one-time-code' : 'email'}
            textContentType={inCode ? 'oneTimeCode' : 'emailAddress'}
            returnKeyType="done"
            onSubmitEditing={action}
            accessibilityLabel={inCode ? t('onboarding.scene.codeA11y') : t('onboarding.scene.emailA11y')}
            boxStyle={{ backgroundColor: c.bg, minHeight: 48, paddingRight: 6 }}
            right={
              <Pressable
                accessibilityRole="button"
                onPress={action}
                disabled={!actionReady || busy}
                style={[styles.verify, { backgroundColor: c.accent, opacity: actionReady && !busy ? 1 : 0.4 }]}
              >
                <Text style={[onest('bold', 14), { color: c.onAccent }]}>
                  {inCode || !isLive ? t('onboarding.scene.verify') : t('onboarding.scene.sendCode')}
                </Text>
              </Pressable>
            }
          />
          <Text style={[type.footnote, { color: error || failure ? c.danger : c.muted }]}>{hint}</Text>
          {inCode && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setStage('email');
                setCode('');
                setFailure(null);
              }}
            >
              <Text style={[type.footnote, { color: ink }]}>{t('onboarding.scene.changeEmail')}</Text>
            </Pressable>
          )}
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
      <Bell size={22} color={accentInk(c, scheme)} strokeWidth={2} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[onest('bold', 15, 19), { color: c.text }]}>{t('onboarding.scene.notify')}</Text>
        <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{t('onboarding.scene.notifyText')}</Text>
      </View>
      <Toggle value={value} onChange={onChange} accessibilityLabel={t('onboarding.scene.notify')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 14, paddingRight: 16, paddingVertical: 14 },
  dot: { width: 44, height: 44, borderRadius: 22 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  email: { paddingLeft: 14, paddingRight: 16, paddingBottom: 14, gap: 8 },
  verify: { height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notify: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 14, paddingVertical: 14, borderRadius: 18 },
});
