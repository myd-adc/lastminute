import { router } from 'expo-router';
import { useState } from 'react';

import { PASSWORD_MIN, signUp } from '@/api/auth';
import { isLive } from '@/api/client';
import { AuthError, MobileAuth, PasswordInput, SwitchLine, WideAuth } from '@/components/onboarding/AuthForms';
import { EmailInput, isEmail, normalizeEmail } from '@/components/onboarding/EmailInput';
import { Field, FieldLabel } from '@/components/onboarding/kit';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

// M01b / W01b «Реєстрація»: e-mail + password, then the code from the letter (M02) confirms the address.
export default function SignupScreen() {
  const { state, dispatch } = useStore();
  const { c } = useTheme();
  const { t } = useT();
  const wide = useIsWide();
  const [email, setEmail] = useState(() => state.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = isEmail(email) && password.length >= PASSWORD_MIN && !busy;

  const submit = async () => {
    if (!valid) return;
    const address = normalizeEmail(email);
    if (isLive) {
      setBusy(true);
      setError(null);
      const res = await signUp(address, password);
      setBusy(false);
      if (!res.ok) return setError(t(res.error === 'exists' ? 'onboarding.errors.exists' : 'onboarding.errors.signup'));
    }
    dispatch({ type: 'setEmail', email: address });
    router.push({ pathname: '/code', params: { mode: 'signup' } });
  };

  const hint = (
    <Text style={[type.footnote, { color: password && password.length < PASSWORD_MIN ? c.danger : c.muted }]}>
      {t('onboarding.signup.passwordHint', { count: PASSWORD_MIN })}
    </Text>
  );
  const rest = (
    <>
      <Button label={t('onboarding.signup.create')} disabled={!valid} loading={busy} onPress={submit} />
      <AuthError text={error} />
      <SwitchLine lead={t('onboarding.signup.haveAccount')} link={t('onboarding.signup.toSignIn')} onPress={() => router.replace('/login')} />
    </>
  );

  if (wide)
    return (
      <WideAuth title={t('onboarding.signup.title')} subtitle={t('onboarding.signup.wideSubtitle')}>
        <Field label={t('onboarding.login.emailLabel')}>
          <EmailInput value={email} onChange={setEmail} autoFocus size="md" />
        </Field>
        <Field label={t('onboarding.login.passwordLabel')}>
          <PasswordInput value={password} onChange={setPassword} onSubmit={submit} placeholder={t('onboarding.signup.passwordPlaceholder')} fresh size="md" />
        </Field>
        {hint}
        {rest}
      </WideAuth>
    );
  return (
    <MobileAuth>
      <FieldLabel label={t('onboarding.login.emailLabel')} />
      <EmailInput value={email} onChange={setEmail} />
      <FieldLabel label={t('onboarding.login.passwordLabel')} />
      <PasswordInput value={password} onChange={setPassword} onSubmit={submit} placeholder={t('onboarding.signup.passwordPlaceholder')} fresh />
      {hint}
      {rest}
    </MobileAuth>
  );
}
