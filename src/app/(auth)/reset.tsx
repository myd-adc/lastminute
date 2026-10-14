import { router } from 'expo-router';
import { useState } from 'react';

import { requestReset } from '@/api/auth';
import { isLive } from '@/api/client';
import { AuthError, StepScreen } from '@/components/onboarding/AuthForms';
import { EmailInput, isEmail, normalizeEmail } from '@/components/onboarding/EmailInput';
import { Field } from '@/components/onboarding/kit';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M01c "Forgot your password?": the recovery code goes to the address (M02), then M02b sets the new password.
export default function ResetScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [email, setEmail] = useState(() => state.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = isEmail(email) && !busy;

  const submit = async () => {
    if (!valid) return;
    const address = normalizeEmail(email);
    if (isLive) {
      setBusy(true);
      setError(null);
      const res = await requestReset(address);
      setBusy(false);
      if (!res.ok) return setError(t('onboarding.errors.send'));
    }
    dispatch({ type: 'setEmail', email: address });
    router.push({ pathname: '/code', params: { mode: 'reset' } });
  };

  return (
    <StepScreen
      title={t('onboarding.reset.title')}
      sub={t('onboarding.reset.sub')}
      cta={<Button label={t('onboarding.reset.send')} disabled={!valid} loading={busy} onPress={submit} />}
    >
      <Field label={t('onboarding.login.emailLabel')}>
        <EmailInput value={email} onChange={setEmail} onSubmit={submit} autoFocus />
      </Field>
      <AuthError text={error} />
    </StepScreen>
  );
}
