import { Redirect, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthSplit } from '@/components/onboarding/AuthSplit';
import { CODE_LENGTH, CodeForm } from '@/components/onboarding/CodeForm';
import { HeroBlobs } from '@/components/onboarding/HeroBlobs';
import { formatE164 } from '@/components/onboarding/PhoneInput';
import { Button, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { display, type, useTheme } from '@/theme';

const back = () => (router.canGoBack() ? router.back() : router.replace('/login'));

// M02 «Введи код з SMS». Demo backend: any 6 digits are accepted.
export default function CodeScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const [code, setCode] = useState('');
  const complete = code.length === CODE_LENGTH;

  if (!state.phone) return <Redirect href="/login" />;

  const submit = () => {
    if (!complete) return;
    dispatch({ type: 'verifyPhone' });
    router.push('/profile-setup');
  };

  const heading = (
    <View style={{ gap: 8 }}>
      <Text style={[wide ? display(34, 42) : type.title, { color: c.text }]}>{t('onboarding.code.title')}</Text>
      <Text style={[type.subhead, { color: c.muted }]}>
        {t('onboarding.code.sentTo')}
        <Text style={{ color: c.text }}>{formatE164(state.phone)}</Text>
      </Text>
    </View>
  );
  const form = <CodeForm code={code} onChange={setCode} onSubmit={submit} onChangeNumber={back} />;
  const cta = <Button label={t('common.confirm')} disabled={!complete} onPress={submit} />;

  if (wide)
    return (
      <AuthSplit>
        <View style={{ gap: 20 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={back} style={{ alignSelf: 'flex-start' }}>
            <ChevronLeft size={26} color={c.text} />
          </Pressable>
          {heading}
          {form}
          {cta}
        </View>
      </AuthSplit>
    );

  return (
    <Screen keyboard footer={cta}>
      <HeroBlobs variant="corner" height={320} />
      <View style={{ minHeight: 44, justifyContent: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={back} style={{ alignSelf: 'flex-start' }}>
          <ChevronLeft size={26} color={c.text} />
        </Pressable>
      </View>
      {heading}
      {form}
    </Screen>
  );
}
