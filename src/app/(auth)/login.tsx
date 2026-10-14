import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { resendCode, signIn } from '@/api/auth';
import { isLive } from '@/api/client';
import { AuthError, LoginInput, MobileAuth, PasswordInput, SwitchLine, WideAuth } from '@/components/onboarding/AuthForms';
import { Field, FieldLabel, TextLink } from '@/components/onboarding/kit';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';

// M01 / W01 «Вхід»: @username or e-mail + password; «Забув пароль?» and the switch to sign-up.
export default function LoginScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const wide = useIsWide();
  const [login, setLogin] = useState(() => state.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = login.trim().length >= 3 && password.length > 0 && !busy;

  const submit = async () => {
    if (!valid) return;
    const typed = login.trim().toLowerCase().replace(/^@/, '');
    // Demo: there are no accounts to check, so signing in starts a fresh demo profile.
    if (!isLive) {
      if (typed.includes('@')) dispatch({ type: 'setEmail', email: typed });
      dispatch({ type: 'verifyEmail' });
      return router.push('/profile-setup');
    }
    setBusy(true);
    setError(null);
    const res = await signIn(typed, password);
    setBusy(false);
    if (!res.ok) {
      // Signed up but never entered the code: send a fresh one and continue there.
      if (res.error === 'unconfirmed' && typed.includes('@')) {
        await resendCode(typed, 'signup');
        dispatch({ type: 'setEmail', email: typed });
        return router.push({ pathname: '/code', params: { mode: 'signup' } });
      }
      return setError(t(res.error === 'invalid' ? 'onboarding.errors.invalid' : res.error === 'too_many' ? 'onboarding.errors.tooMany' : 'onboarding.errors.signin'));
    }
    dispatch({ type: 'setEmail', email: res.data.email });
    if (res.data.account) {
      // The guard switches to the app once the account is restored.
      dispatch({ type: 'restoreAccount', ...res.data.account });
      setTimeout(() => router.replace('/'), 0);
      return;
    }
    // Confirmed but without a profile yet (left during onboarding): continue with M03.
    dispatch({ type: 'verifyEmail' });
    router.push('/profile-setup');
  };

  const forgot = <TextLink label={t('onboarding.login.forgot')} size={14} onPress={() => router.push('/reset')} />;
  const fields = (size: 'md' | 'lg') => (
    <>
      {size === 'lg' ? (
        <>
          <FieldLabel label={t('onboarding.login.loginLabel')} />
          <LoginInput value={login} onChange={setLogin} />
          <FieldLabel label={t('onboarding.login.passwordLabel')} />
          <PasswordInput value={password} onChange={setPassword} onSubmit={submit} />
        </>
      ) : (
        <>
          <Field label={t('onboarding.login.loginLabel')}>
            <LoginInput value={login} onChange={setLogin} autoFocus size="md" />
          </Field>
          <Field label={t('onboarding.login.passwordLabel')}>
            <PasswordInput value={password} onChange={setPassword} onSubmit={submit} size="md" />
          </Field>
        </>
      )}
      <View style={{ alignSelf: 'flex-end' }}>{forgot}</View>
      <Button label={t('onboarding.login.signIn')} disabled={!valid} loading={busy} onPress={submit} />
      <AuthError text={error} />
      <SwitchLine lead={t('onboarding.login.noAccount')} link={t('onboarding.login.toSignUp')} onPress={() => router.replace('/signup')} />
    </>
  );

  if (wide)
    return (
      <WideAuth title={t('onboarding.login.title')} subtitle={t('onboarding.login.wideSubtitle')}>
        {fields('md')}
      </WideAuth>
    );
  return <MobileAuth>{fields('lg')}</MobileAuth>;
}
