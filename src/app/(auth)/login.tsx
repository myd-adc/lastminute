import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthSplit } from '@/components/onboarding/AuthSplit';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { Field, FieldLabel, LanguagePill, Logo, useAccentInk } from '@/components/onboarding/kit';
import { EmailInput, isEmail, normalizeEmail } from '@/components/onboarding/EmailInput';
import { QrCard } from '@/components/onboarding/QrCard';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { requestCode } from '@/api/auth';
import { isLive } from '@/api/client';
import { useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

// M01 / W01 «Вхід» (sign in): e-mail → code from the letter, language pill top right.
export default function LoginScreen() {
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const [email, setEmail] = useState(() => state.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useT();
  const valid = isEmail(email) && !busy;

  const submit = async () => {
    if (!valid) return;
    const address = normalizeEmail(email);
    if (isLive) {
      setBusy(true);
      setError(null);
      const res = await requestCode(address);
      setBusy(false);
      if (!res.ok) return setError(t('onboarding.errors.send'));
    }
    dispatch({ type: 'setEmail', email: address });
    router.push('/code');
  };

  if (wide) return <WideLogin email={email} setEmail={setEmail} valid={valid} submit={submit} error={error} />;
  return <MobileLogin email={email} setEmail={setEmail} valid={valid} submit={submit} error={error} />;
}

type FormProps = { email: string; setEmail: (v: string) => void; valid: boolean; submit: () => void; error: string | null };

// M01: logo row 14 pt below the safe area, hero at y 268 (≈ 172 pt of free space above it), the form right under the
// tagline and ≈ 120 pt free below the trust line. The two flexible gaps keep that 172 : 83 split on any screen height.
function MobileLogin({ email, setEmail, valid, submit, error }: FormProps) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <AuthScreen glow="login" top={14}>
      <View style={styles.topRow}>
        <Logo />
        <LanguagePill />
      </View>
      <View style={[styles.flexGap, { flexGrow: 172 }]} />
      <Text style={[styles.hero, { color: c.text }]}>{t('onboarding.hero')}</Text>
      <Text style={[onest('regular', 16, 22), { color: c.muted, marginTop: 39 }]}>{t('onboarding.tagline')}</Text>
      <View style={styles.form}>
        <FieldLabel label={t('onboarding.login.emailLabel')} />
        <EmailInput value={email} onChange={setEmail} onSubmit={submit} />
        <Button label={t('onboarding.login.getCode')} disabled={!valid} onPress={submit} />
        {error && <Text style={[type.footnote, { color: c.danger }]}>{error}</Text>}
        <TrustLine text={t('onboarding.login.trust')} />
      </View>
      <View style={[styles.flexGap, { flexGrow: 83 }]} />
    </AuthScreen>
  );
}

// W01 auth panel: «Вхід» form, «або», QR block, trust line (16 pt rhythm).
function WideLogin({ email, setEmail, valid, submit, error }: FormProps) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <AuthSplit languagePill>
      <View style={{ gap: 16 }}>
        <Text style={[display(32, 40), { color: c.text }]}>{t('onboarding.login.title')}</Text>
        <Text style={[onest('regular', 15, 22), { color: c.muted }]}>{t('onboarding.login.wideSubtitle')}</Text>
        <Field label={t('onboarding.login.emailLabel')}>
          <EmailInput value={email} onChange={setEmail} onSubmit={submit} autoFocus size="md" />
        </Field>
        <Button label={t('onboarding.login.getCode')} disabled={!valid} onPress={submit} />
        {error && <Text style={[type.footnote, { color: c.danger }]}>{error}</Text>}
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
          <Text style={[onest('medium', 13), { color: c.muted }]}>{t('onboarding.login.or')}</Text>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
        </View>
        <QrCard />
        <TrustLine text={t('onboarding.login.trustShort')} />
      </View>
    </AuthSplit>
  );
}

function TrustLine({ text }: { text: string }) {
  const { c } = useTheme();
  const ink = useAccentInk();
  return (
    <View style={styles.trust}>
      <ShieldCheck size={18} color={ink} strokeWidth={2} />
      <Text style={[type.footnote, { color: c.muted, flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flexGap: { flexBasis: 0, minHeight: 24 },
  // Figma: Unbounded Bold 38, line height 1.08, tracking −3 %.
  hero: { ...display(38, 41), letterSpacing: -1.14 },
  form: { gap: 12, marginTop: 48 },
  trust: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1 },
});
