import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { requestStudentEmailCode, verifyStudentEmail } from '@/api/auth';
import { isLive } from '@/api/client';
import { Field, TextField, useAccentInk } from '@/components/onboarding/kit';
import { Text } from '@/components/ui/Text';
import type { Community } from '@/data/types';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

type Action = { label: string; onPress: () => void; disabled: boolean; loading: boolean };

const onDomain = (email: string, domain: string) => email.trim().toLowerCase().endsWith('@' + domain);

// M19 join for a domain-only community: the sign-in address already on the domain joins at once; otherwise a
// 6-digit code confirms the campus address first (it then becomes the sign-in address). Demo: any code works.
export function useDomainJoin(community: Community): { form: ReactNode; action: Action } {
  const { state, dispatch, joinCommunity } = useStore();
  const { t } = useT();
  const { c } = useTheme();
  const ink = useAccentInk();
  const domain = community.emailDomain ?? '';
  const signedInOnDomain = !!state.email && onDomain(state.email, domain);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = email.trim().toLowerCase();

  const join = async () => {
    setBusy(true);
    const ok = await joinCommunity(community);
    setBusy(false);
    if (!ok) setError(t('community.page.joinFailed'));
  };

  const sendCode = async () => {
    if (!onDomain(address, domain)) return setError(t('community.email.wrongDomain', { domain }));
    setError(null);
    if (isLive) {
      setBusy(true);
      const res = await requestStudentEmailCode(address);
      setBusy(false);
      if (!res.ok) return setError(t(res.error === 'email_taken' ? 'community.email.taken' : 'community.email.sendFailed'));
    }
    setStage('code');
  };

  const confirm = async () => {
    if (isLive) {
      setBusy(true);
      const res = await verifyStudentEmail(address, code.trim());
      setBusy(false);
      if (!res.ok) return setError(t('community.email.badCode'));
    }
    dispatch({ type: 'setEmail', email: address });
    dispatch({ type: 'verifyEmail' });
    await join();
  };

  if (signedInOnDomain) return { form: null, action: { label: t('community.page.join'), onPress: join, disabled: busy, loading: busy } };

  const inCode = stage === 'code';
  const hint = error ?? (inCode ? t('community.email.codeSent', { email: address }) : null);
  const form = (
    <View style={{ gap: 8 }}>
      <Field label={inCode ? t('community.email.codeA11y') : t('community.email.label', { domain })}>
        <TextField
          value={inCode ? code : email}
          onChangeText={(text) => {
            if (inCode) setCode(text.replace(/\D/g, '').slice(0, 6));
            else setEmail(text);
            if (error) setError(null);
          }}
          placeholder={inCode ? t('community.email.codePlaceholder') : t('community.email.placeholder', { domain })}
          keyboardType={inCode ? 'number-pad' : 'email-address'}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={inCode ? 'one-time-code' : 'email'}
          textContentType={inCode ? 'oneTimeCode' : 'emailAddress'}
          accessibilityLabel={inCode ? t('community.email.codeA11y') : t('community.email.a11y')}
          boxStyle={{ minHeight: 54 }}
        />
      </Field>
      {hint && <Text style={[type.footnote, { color: error ? c.danger : c.muted }]}>{hint}</Text>}
      {inCode && (
        <Pressable accessibilityRole="button" onPress={() => { setStage('email'); setCode(''); setError(null); }}>
          <Text style={[type.footnote, { color: ink }]}>{t('community.email.changeEmail')}</Text>
        </Pressable>
      )}
    </View>
  );
  const action: Action = inCode
    ? { label: t('community.email.confirm'), onPress: confirm, disabled: busy || code.trim().length < 6, loading: busy }
    : { label: t('community.email.sendCode'), onPress: sendCode, disabled: busy || !email.trim(), loading: busy };
  return { form, action };
}
