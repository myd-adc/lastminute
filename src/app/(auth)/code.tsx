import { Redirect, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthSplit } from '@/components/onboarding/AuthSplit';
import { CODE_LENGTH, CodeForm } from '@/components/onboarding/CodeForm';
import { AuthScreen } from '@/components/onboarding/AuthScreen';
import { formatE164 } from '@/components/onboarding/PhoneInput';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { display, onest, useTheme } from '@/theme';

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

  // M02: title Unbounded 28 / 1.15, subtitle 15 / 1.4 with the number in the text colour, 10 pt apart.
  const heading = (
    <View style={{ gap: 10 }}>
      <Text style={[wide ? display(32, 40) : display(28, 32), { color: c.text }]}>{t('onboarding.code.title')}</Text>
      <Text style={[onest('regular', 15, 21), { color: c.muted }]}>
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
            <ChevronLeft size={24} color={c.text} strokeWidth={2} />
          </Pressable>
          {heading}
          {form}
          {cta}
        </View>
      </AuthSplit>
    );

  // M02: back chevron 12 pt below the safe area, 28 pt to the title, 30 pt to the code boxes; «Підтвердити» rides
  // 12 pt above the number pad.
  return (
    <AuthScreen glow="code" footer={cta}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={back} style={{ alignSelf: 'flex-start' }}>
        <ChevronLeft size={24} color={c.text} strokeWidth={2} />
      </Pressable>
      <View style={{ marginTop: 28, marginBottom: 30 }}>{heading}</View>
      {form}
    </AuthScreen>
  );
}
