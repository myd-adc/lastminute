import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthSplit } from '@/components/onboarding/AuthSplit';
import { HeroBlobs } from '@/components/onboarding/HeroBlobs';
import { FieldLabel, LanguagePill, Logo, useAccentInk } from '@/components/onboarding/kit';
import { onlyDigits, PHONE_DIGITS, PhoneInput, toE164 } from '@/components/onboarding/PhoneInput';
import { QrPlaceholder } from '@/components/onboarding/QrPlaceholder';
import { Button, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

const APP_STORE = 'https://apps.apple.com/';
const GOOGLE_PLAY = 'https://play.google.com/store';

// M01 / W01 «Вхід» (sign in): phone number → SMS code, language pill top right.
export default function LoginScreen() {
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const [digits, setDigits] = useState(() => onlyDigits(state.phone ?? '').replace(/^380/, ''));
  const valid = digits.length === PHONE_DIGITS;

  const submit = () => {
    if (!valid) return;
    dispatch({ type: 'setPhone', phone: toE164(digits) });
    router.push('/code');
  };

  if (wide) return <WideLogin digits={digits} setDigits={setDigits} valid={valid} submit={submit} />;
  return <MobileLogin digits={digits} setDigits={setDigits} valid={valid} submit={submit} />;
}

type FormProps = { digits: string; setDigits: (d: string) => void; valid: boolean; submit: () => void };

function MobileLogin({ digits, setDigits, valid, submit }: FormProps) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <Screen keyboard padded={false} contentStyle={styles.mobile}>
      <HeroBlobs variant="hero" height={600} />
      <View style={styles.topRow}>
        <Logo />
        <LanguagePill />
      </View>
      <View style={styles.spacer} />
      <Text style={[type.hero, { color: c.text }]}>{t('onboarding.hero')}</Text>
      <Text style={[type.body, { color: c.muted, marginBottom: 24 }]}>{t('onboarding.tagline')}</Text>
      <FieldLabel label={t('onboarding.login.phoneLabel')} />
      <PhoneInput digits={digits} onChange={setDigits} onSubmit={submit} />
      <Button label={t('onboarding.login.getCode')} disabled={!valid} onPress={submit} />
      <TrustLine text={t('onboarding.login.trust')} />
    </Screen>
  );
}

function WideLogin({ digits, setDigits, valid, submit }: FormProps) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <AuthSplit languagePill>
      <View style={{ gap: 16 }}>
        <Text style={[display(34, 42), { color: c.text }]}>{t('onboarding.login.title')}</Text>
        <Text style={[type.subhead, { color: c.muted, marginBottom: 4 }]}>
          {t('onboarding.login.wideSubtitle')}
        </Text>
        <FieldLabel label={t('onboarding.login.phoneLabel')} />
        <PhoneInput digits={digits} onChange={setDigits} onSubmit={submit} autoFocus />
        <Button label={t('onboarding.login.getCode')} disabled={!valid} onPress={submit} />
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
          <Text style={[type.footnote, { color: c.muted }]}>{t('onboarding.login.or')}</Text>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
        </View>
        <View style={[styles.qrCard, { backgroundColor: c.bg }]}>
          <QrPlaceholder size={124} />
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[onest('bold', 16), { color: c.text }]}>{t('onboarding.login.phoneBetter')}</Text>
            <Text style={[type.footnote, { color: c.muted }]}>
              {t('onboarding.login.phoneBetterText')}
            </Text>
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
  mobile: { flexGrow: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { flexGrow: 1, minHeight: 72 },
  trust: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1 },
  qrCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 16, borderRadius: 20 },
  stores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  store: { height: 32, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center' },
});
