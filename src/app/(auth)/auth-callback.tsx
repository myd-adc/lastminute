import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { finishOAuth } from '@/api/oauth';
import { useCompleteSignIn } from '@/components/onboarding/OAuth';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { type, useTheme } from '@/theme';

// Where Google sends the browser back (web) or the deep link lands (app): trades the code for a session, then
// restores the account or starts onboarding, the same way a password sign-in does.
export default function AuthCallbackScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const complete = useCompleteSignIn();
  const url = Linking.useURL();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    finishOAuth(url).then((res) => {
      if (!alive) return;
      if (res.ok) complete(res.data);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [url, complete]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {failed ? (
        <>
          <Text style={[type.body, { color: c.text, textAlign: 'center' }]}>{t('onboarding.oauth.failed')}</Text>
          <Button label={t('onboarding.oauth.toLogin')} onPress={() => router.replace('/login')} style={styles.cta} />
        </>
      ) : (
        <>
          <ActivityIndicator color={c.text} />
          <Text style={[type.subhead, { color: c.muted }]}>{t('onboarding.oauth.finishing')}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  cta: { alignSelf: 'stretch', maxWidth: 420, width: '100%' },
});
