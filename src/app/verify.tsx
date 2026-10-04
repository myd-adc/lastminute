import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { STUDENT_DOMAINS, useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

// Student email check, asked on the first "Познайомитись" (not at the door).
// Demo: no email is sent, any 4-digit code is accepted.
export default function VerifyScreen() {
  const { eventId, userId } = useLocalSearchParams<{ eventId?: string; userId?: string }>();
  const { dispatch } = useAppStore();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');

  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  const emailOk = /^[^\s@]+@[^\s@]+$/.test(email.trim()) && STUDENT_DOMAINS.includes(domain);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const confirm = () => {
    if (!/^\d{4}$/.test(code)) return;
    dispatch({ type: 'verify', email: email.trim().toLowerCase() });
    if (eventId && userId) dispatch({ type: 'sendInterest', eventId, userId });
    close();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.content}>
        <Text style={type.largeTitle}>Студентська пошта</Text>
        <Text style={[type.subhead, { color: colors.label2 }]}>
          Знайомитись можна лише з підтвердженою поштою закладу — так ми знаємо, що всі тут справжні. Пошту ніхто не
          побачить.
        </Text>

        {step === 'email' ? (
          <>
            <Field
              label="Пошта"
              autoFocus
              value={email}
              onChangeText={setEmail}
              placeholder="ім'я@lpnu.ua"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => emailOk && setStep('code')}
            />
            <Text style={[type.footnote, { color: email && !emailOk ? colors.tint : colors.label2 }]}>
              Підходить: {STUDENT_DOMAINS.map((d) => '@' + d).join(', ')}
            </Text>
          </>
        ) : (
          <>
            <Field
              label={`Код із листа на ${email.trim()}`}
              autoFocus
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="0000"
              keyboardType="number-pad"
              onSubmitEditing={confirm}
            />
            <Text style={[type.footnote, { color: colors.label2 }]}>Демо: підійде будь-який код із 4 цифр.</Text>
          </>
        )}

        <View style={{ flex: 1 }} />
        {step === 'email' ? (
          <Button title="Надіслати код" onPress={() => setStep('code')} disabled={!emailOk} />
        ) : (
          <Button title={userId ? 'Підтвердити й познайомитись' : 'Підтвердити'} onPress={confirm} disabled={code.length !== 4} />
        )}
        <Button title="Скасувати" variant="quiet" onPress={close} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.grouped, paddingHorizontal: 16, alignItems: 'center' },
  content: { flex: 1, width: '100%', maxWidth: 480, gap: 14 },
});
