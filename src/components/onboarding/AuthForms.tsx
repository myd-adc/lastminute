import { router } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { display, onest, type, useTheme } from '@/theme';

import { AuthScreen } from './AuthScreen';
import { AuthSplit } from './AuthSplit';
import { LanguagePill, Logo, TextField, useAccentInk } from './kit';
import { QrCard } from './QrCard';

type Size = 'md' | 'lg'; // lg = M01 (56 pt, 16 radius, 18 inset), md = W01 (52 pt, 14 radius, 16 inset)

// "Username or email" on M01 / W01.
export function LoginInput({ value, onChange, onSubmit, autoFocus, size = 'lg' }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; autoFocus?: boolean; size?: Size }) {
  const { t } = useT();
  return (
    <TextField
      value={value}
      onChangeText={onChange}
      placeholder={t('onboarding.login.loginPlaceholder')}
      textContentType="username"
      autoComplete="username"
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus={autoFocus}
      returnKeyType="next"
      onSubmitEditing={onSubmit}
      accessibilityLabel={t('onboarding.login.loginLabel')}
      boxStyle={size === 'lg' ? styles.lg : styles.md}
    />
  );
}

// "Password" with "Show / Hide" at the end; `fresh` marks a new password for password managers.
export function PasswordInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  fresh,
  autoFocus,
  size = 'lg',
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  fresh?: boolean;
  autoFocus?: boolean;
  size?: Size;
}) {
  const { c } = useTheme();
  const { t } = useT();
  const [shown, setShown] = useState(false);
  return (
    <TextField
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? t('onboarding.login.passwordPlaceholder')}
      secureTextEntry={!shown}
      textContentType={fresh ? 'newPassword' : 'password'}
      autoComplete={fresh ? 'new-password' : 'current-password'}
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus={autoFocus}
      returnKeyType="done"
      onSubmitEditing={onSubmit}
      accessibilityLabel={t('onboarding.login.passwordLabel')}
      boxStyle={size === 'lg' ? styles.lg : styles.md}
      right={
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setShown((v) => !v)}>
          <Text style={[onest('medium', 14), { color: c.muted }]}>{shown ? t('onboarding.login.hide') : t('onboarding.login.show')}</Text>
        </Pressable>
      }
    />
  );
}

// "No account yet? Sign up" / "Already have an account? Sign in", centred under the main button.
export function SwitchLine({ lead, link, onPress }: { lead: string; link: string; onPress: () => void }) {
  const { c } = useTheme();
  const ink = useAccentInk();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.switch}>
      <Text style={[onest('regular', 15, 20), { color: c.muted, textAlign: 'center' }]}>
        {lead}
        <Text style={[onest('semibold', 15, 20), { color: ink }]}>{link}</Text>
      </Text>
    </Pressable>
  );
}

export function AuthError({ text }: { text: string | null }) {
  const { c } = useTheme();
  return text ? <Text style={[type.footnote, { color: c.danger }]}>{text}</Text> : null;
}

// M01 / M01b: logo row, the hero and tagline, the form in the lower part of the screen (12 pt rhythm).
export function MobileAuth({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <AuthScreen glow="login" top={14}>
      <View style={styles.topRow}>
        <Logo />
        <LanguagePill />
      </View>
      <View style={[styles.flexGap, { flexGrow: 120 }]} />
      <Text style={[styles.hero, { color: c.text }]}>{t('onboarding.hero')}</Text>
      <Text style={[onest('regular', 16, 22), { color: c.muted, marginTop: 12 }]}>{t('onboarding.tagline')}</Text>
      <View style={styles.form}>{children}</View>
      <View style={[styles.flexGap, { flexGrow: 20 }]} />
    </AuthScreen>
  );
}

// W01 / W01b auth panel: title, subtitle, the form, "or", the QR block and the trust line (16 pt rhythm).
export function WideAuth({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { c } = useTheme();
  const { t } = useT();
  const ink = useAccentInk();
  return (
    <AuthSplit languagePill>
      <View style={{ gap: 16 }}>
        <Text style={[display(32, 40), { color: c.text }]}>{title}</Text>
        <Text style={[onest('regular', 15, 22), { color: c.muted }]}>{subtitle}</Text>
        {children}
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
          <Text style={[onest('medium', 13), { color: c.muted }]}>{t('onboarding.login.or')}</Text>
          <View style={[styles.orLine, { backgroundColor: c.line }]} />
        </View>
        <QrCard />
        <View style={styles.trust}>
          <ShieldCheck size={18} color={ink} strokeWidth={2} />
          <Text style={[type.footnote, { color: c.muted, flex: 1 }]}>{t('onboarding.login.trustShort')}</Text>
        </View>
      </View>
    </AuthSplit>
  );
}

const back = () => (router.canGoBack() ? router.back() : router.replace('/login'));

// M01c / M02b (and the shape of M02): back chevron, title and subtitle, the fields, the button under them.
export function StepScreen({ title, sub, cta, children }: { title: string; sub: string; cta: ReactNode; children: ReactNode }) {
  const { c } = useTheme();
  const { t } = useT();
  const wide = useIsWide();
  const head = (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={back} style={{ alignSelf: 'flex-start' }}>
        <ChevronLeft size={24} color={c.text} strokeWidth={2} />
      </Pressable>
      <View style={{ gap: 10, marginTop: wide ? 0 : 18 }}>
        <Text style={[wide ? display(32, 40) : display(28, 32), { color: c.text }]}>{title}</Text>
        <Text style={[onest('regular', 15, 21), { color: c.muted }]}>{sub}</Text>
      </View>
    </>
  );
  if (wide)
    return (
      <AuthSplit>
        <View style={{ gap: 20 }}>
          {head}
          {children}
          {cta}
        </View>
      </AuthSplit>
    );
  return (
    <AuthScreen glow="code">
      {head}
      <View style={{ gap: 12, marginTop: 24 }}>
        {children}
        <View style={{ marginTop: 12 }}>{cta}</View>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  lg: { height: 56, borderRadius: 16, paddingHorizontal: 18 },
  md: { height: 52, minHeight: 52, borderRadius: 14, paddingHorizontal: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flexGap: { flexBasis: 0, minHeight: 24 },
  // Figma: Unbounded Bold 38, line height 1.08, tracking −3 %.
  hero: { ...display(38, 41), letterSpacing: -1.14 },
  form: { gap: 12, marginTop: 36 },
  switch: { alignSelf: 'center', paddingVertical: 4 },
  trust: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1 },
});
