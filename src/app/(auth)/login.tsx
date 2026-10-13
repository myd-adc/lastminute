import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AuthSplit } from '@/components/onboarding/AuthSplit';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { Field, FieldLabel, LanguagePill, Logo, useAccentInk } from '@/components/onboarding/kit';
import { onlyDigits, PHONE_DIGITS, PhoneInput, toE164 } from '@/components/onboarding/PhoneInput';
import { QrPlaceholder } from '@/components/onboarding/QrPlaceholder';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { requestCode } from '@/api/auth';
import { isLive } from '@/api/client';
import { useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

const APP_STORE = 'https://apps.apple.com/';
const GOOGLE_PLAY = 'https://play.google.com/store';

// M01 / W01 «Вхід» (sign in): phone number → SMS code, language pill top right.
export default function LoginScreen() {
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const [digits, setDigits] = useState(() => onlyDigits(state.phone ?? '').replace(/^380/, ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useT();
  const valid = digits.length === PHONE_DIGITS && !busy;

  const submit = async () => {
    if (!valid) return;
    const phone = toE164(digits);
    if (isLive) {
      setBusy(true);
      setError(null);
      const res = await requestCode(phone);
      setBusy(false);
      if (!res.ok) return setError(t('onboarding.errors.send'));
    }
    dispatch({ type: 'setPhone', phone });
    router.push('/code');
  };

  if (wide) return <WideLogin digits={digits} setDigits={setDigits} valid={valid} submit={submit} error={error} />;
  return <MobileLogin digits={digits} setDigits={setDigits} valid={valid} submit={submit} error={error} />;
}

type FormProps = { digits: string; setDigits: (d: string) => void; valid: boolean; submit: () => void; error: string | null };

// M01: logo row 14 pt below the safe area, hero at y 268 (≈ 172 pt of free space above it), the form right under the
// tagline and ≈ 120 pt free below the trust line. The two flexible gaps keep that 172 : 83 split on any screen height.
function MobileLogin({ digits, setDigits, valid, submit, error }: FormProps) {
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
        <FieldLabel label={t('onboarding.login.phoneLabel')} />
        <PhoneInput digits={digits} onChange={setDigits} onSubmit={submit} />
        <Button label={t('onboarding.login.getCode')} disabled={!valid} onPress={submit} />
        {error && <Text style={[type.footnote, { color: c.danger }]}>{error}</Text>}
        <TrustLine text={t('onboarding.login.trust')} />
      </View>
      <View style={[styles.flexGap, { flexGrow: 83 }]} />
    </AuthScreen>
  );
}

// W01 auth panel: «Вхід» form, «або», QR block, trust line (16 pt rhythm).
function WideLogin({ digits, setDigits, valid, submit, error }: FormProps) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <AuthSplit languagePill>
      <View style={{ gap: 16 }}>
        <Text style={[display(32, 40), { color: c.text }]}>{t('onboarding.login.title')}</Text>
        <Text style={[onest('regular', 15, 22), { color: c.muted }]}>{t('onboarding.login.wideSubtitle')}</Text>
        <Field label={t('onboarding.login.phoneLabel')}>
          <PhoneInput digits={digits} onChange={setDigits} onSubmit={submit} autoFocus size="md" />
        </Field>
        <Button label={t('onboarding.login.getCode')} disabled={!valid} onPress={submit} />
        {error && <Text style={[type.footnote, { color: c.danger }]}>{error}</Text>}
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
          <Text style={[onest('medium', 13), { color: c.muted }]}>{t('onboarding.login.or')}</Text>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
        </View>
        <View style={[styles.qrCard, { backgroundColor: c.bg }]}>
          <QrPlaceholder size={132} />
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[onest('bold', 16), { color: c.text }]}>{t('onboarding.login.phoneBetter')}</Text>
            <Text style={[onest('regular', 13, 18), { color: c.muted }]}>{t('onboarding.login.phoneBetterText')}</Text>
            <View style={styles.stores}>
              <StorePill label="App Store" url={APP_STORE} />
              <StorePill label="▶ Google Play" url={GOOGLE_PLAY} />
            </View>
          </View>
        </View>
        <TrustLine text={t('onboarding.login.trustShort')} />
      </View>
    </AuthSplit>
  );
}

function StorePill({ label, url }: { label: string; url: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => [styles.store, { backgroundColor: c.surface2 }, pressed && { opacity: 0.8 }]}
    >
      <Text style={[onest('semibold', 13), { color: c.text }]}>{label}</Text>
    </Pressable>
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
  qrCard: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20, borderRadius: 20 },
  stores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  store: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
});
