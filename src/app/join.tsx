import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

// Kept to a single required field on purpose: QR → "Я йду" must take under 15 seconds.
export default function JoinScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { dispatch } = useAppStore();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const submit = () => {
    if (!name.trim()) return;
    dispatch({ type: 'setProfile', profile: { name: name.trim(), affiliation: affiliation.trim(), bio: '', tags: [] } });
    if (eventId) dispatch({ type: 'go', eventId });
    close();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.content}>
        <Text style={type.largeTitle}>Як тебе звати?</Text>
        <Text style={[type.subhead, { color: colors.label2 }]}>
          Це побачать лише ті, хто теж іде на цю подію. Решту профілю додаси пізніше.
        </Text>
        <Field label="Імʼя" autoFocus value={name} onChangeText={setName} placeholder="Імʼя" returnKeyType="next" />
        <Field
          label="Група, заклад (необовʼязково)"
          value={affiliation}
          onChangeText={setAffiliation}
          onSubmitEditing={submit}
          placeholder="ПЗ-33, Політехніка"
          returnKeyType="done"
        />
        <View style={{ flex: 1 }} />
        <Button title={eventId ? 'Я йду' : 'Готово'} onPress={submit} disabled={!name.trim()} />
        <Button title="Скасувати" variant="quiet" onPress={close} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.grouped, paddingHorizontal: 16, alignItems: 'center' },
  content: { flex: 1, width: '100%', maxWidth: 480, gap: 14 },
});
