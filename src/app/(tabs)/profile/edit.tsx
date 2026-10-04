import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { NavBack, Screen } from '@/components/Screen';
import { useIsWide } from '@/lib/hooks';
import { useAppStore } from '@/store/AppStore';
import { type } from '@/theme';

export default function EditProfileScreen() {
  const { state, dispatch } = useAppStore();
  const wide = useIsWide();
  const [name, setName] = useState(state.me?.name ?? '');
  const [affiliation, setAffiliation] = useState(state.me?.affiliation ?? '');
  const [bio, setBio] = useState(state.me?.bio ?? '');
  const [tags, setTags] = useState(state.me?.tags.join(', ') ?? '');

  const save = () => {
    if (!name.trim()) return;
    dispatch({
      type: 'setProfile',
      profile: {
        name: name.trim(),
        affiliation: affiliation.trim(),
        bio: bio.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 5),
      },
    });
    router.back();
  };

  return (
    <Screen contentStyle={wide && { maxWidth: 720 + 96 }}>
      <NavBack label="Профіль" fallback="/profile" />
      <Text style={type.title2}>Редагувати профіль</Text>
      <Field label="Імʼя" value={name} onChangeText={setName} placeholder="Імʼя" />
      <Field label="Група, заклад" value={affiliation} onChangeText={setAffiliation} placeholder="ПЗ-33, Політехніка" />
      <Field
        label="Про себе"
        value={bio}
        onChangeText={setBio}
        placeholder="Що любиш і про що можна поговорити"
        multiline
        maxLength={140}
        style={{ minHeight: 88, textAlignVertical: 'top' }}
      />
      <Field label="Теги через кому" value={tags} onChangeText={setTags} placeholder="IT, стендап, гори" />
      <Button title="Зберегти" onPress={save} disabled={!name.trim()} />
    </Screen>
  );
}
