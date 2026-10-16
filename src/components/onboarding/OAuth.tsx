import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { OAuthDone } from '@/api/oauth';
import { googleEnabled, signInWithProvider } from '@/api/oauth';
import { isLive } from '@/api/client';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

// After any sign-in (password, code, Google): a saved profile restores the account, a new one starts onboarding.
export function useCompleteSignIn() {
  const { dispatch } = useStore();
  return useCallback(
    ({ email, account }: OAuthDone) => {
      if (email) dispatch({ type: 'setEmail', email });
      if (account) {
        // The guard switches to the app once the account is restored.
        dispatch({ type: 'restoreAccount', ...account });
        setTimeout(() => router.replace('/'), 0);
        return;
      }
      dispatch({ type: 'verifyEmail' });
      router.replace('/profile-setup');
    },
    [dispatch],
  );
}

// Google's four-colour "G", as its brand guidelines ask for on a sign-in button.
function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

// "Continue with Google" above the e-mail form on M01 / M01b / W01 / W01b, then an "or" rule.
export function OAuthButtons({ onError }: { onError: (message: string | null) => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const complete = useCompleteSignIn();
  const [busy, setBusy] = useState(false);
  // The demo has no accounts to sign into.
  if (!isLive || !googleEnabled) return null;

  const google = async () => {
    onError(null);
    setBusy(true);
    const res = await signInWithProvider('google');
    // Web navigates away to Google; /auth-callback takes it from there.
    if (res.ok && res.data === 'redirected') return;
    setBusy(false);
    if (res.ok) return complete(res.data as OAuthDone);
    if (res.error !== 'cancelled') onError(t('onboarding.oauth.failed'));
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.oauth.google')}
        aria-busy={busy}
        disabled={busy}
        onPress={google}
        style={({ pressed }) => [styles.button, { backgroundColor: c.surface, borderColor: c.line }, (pressed || busy) && { opacity: 0.8 }]}
      >
        {busy ? <ActivityIndicator color={c.text} /> : <GoogleMark />}
        <Text style={[onest('semibold', 16, 20), { color: c.text }]}>{t('onboarding.oauth.google')}</Text>
      </Pressable>
      <View style={styles.orRow}>
        <View style={[styles.orLine, { backgroundColor: c.line }]} />
        <Text style={[onest('medium', 13), { color: c.muted }]}>{t('onboarding.login.or')}</Text>
        <View style={[styles.orLine, { backgroundColor: c.line }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  button: { height: 56, borderRadius: 28, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1 },
});
