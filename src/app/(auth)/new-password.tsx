import { router } from 'expo-router';
import { useState } from 'react';

import { PASSWORD_MIN, setPassword } from '@/api/auth';
import { isLive } from '@/api/client';
import { AuthError, PasswordInput, StepScreen } from '@/components/onboarding/AuthForms';
import { Field } from '@/components/onboarding/kit';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M02b "Set a new password": reached with the session the recovery code opened.
export default function NewPasswordScreen() {
  const { dispatch } = useStore();
  const { t } = useT();
  const [password, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = password.length >= PASSWORD_MIN && !busy;

  const submit = async () => {
    if (!valid) return;
    if (isLive) {
      setBusy(true);
      setError(null);
      const res = await setPassword(password);
      setBusy(false);
      if (!res.ok) return setError(t('onboarding.errors.password'));
      if (res.data) {
        dispatch({ type: 'restoreAccount', ...res.data });
        setTimeout(() => router.replace('/'), 0);
        return;
      }
    }
    // An account without a profile yet continues with onboarding.
    dispatch({ type: 'verifyEmail' });
    router.replace('/profile-setup');
  };

  return (
    <StepScreen
      title={t('onboarding.newPassword.title')}
      sub={t('onboarding.newPassword.sub', { count: PASSWORD_MIN })}
      cta={<Button label={t('onboarding.newPassword.save')} disabled={!valid} loading={busy} onPress={submit} />}
    >
      <Field label={t('onboarding.login.passwordLabel')}>
        <PasswordInput value={password} onChange={setValue} onSubmit={submit} placeholder={t('onboarding.signup.passwordPlaceholder')} fresh autoFocus />
      </Field>
      <AuthError text={error && password.length < PASSWORD_MIN ? t('onboarding.errors.passwordShort', { count: PASSWORD_MIN }) : error} />
    </StepScreen>
  );
}
