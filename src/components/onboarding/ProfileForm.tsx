import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Sheet } from '@/components/ui';
import { useT } from '@/i18n';
import type { Me } from '@/store/AppStore';
import { gradientIds, onest, type, useTheme } from '@/theme';

import { FieldLabel, IdeaChip, InputBox, TextField, TextLink } from './kit';

export const TALK_MAX = 80;

export type ProfileDraft = Me;

export const randomGradient = () => gradientIds[Math.floor(Math.random() * gradientIds.length)];

export const emptyProfile = (): ProfileDraft => ({ name: '', affiliation: '', talkAbout: '', gradient: randomGradient() });

export const isProfileValid = (p: ProfileDraft) => p.name.trim().length > 0;

// Trims the draft before it goes into the store.
export const cleanProfile = (p: ProfileDraft): Me => ({
  ...p,
  name: p.name.trim(),
  affiliation: p.affiliation.trim(),
  talkAbout: p.talkAbout.trim().slice(0, TALK_MAX),
});

// Keys into onboarding.profile.affiliations / .idea; the picked text is stored in the current language.
const AFFILIATIONS = ['philosophy', 'sociology', 'journalism', 'psychology', 'history', 'cs', 'law', 'philology', 'economics', 'masters', 'teaching'] as const;

const IDEAS = ['concert', 'reading', 'boardGame'] as const;

// M03 form, shared by onboarding (profile-setup) and «Змінити профіль».
export function ProfileForm({ value, onChange }: { value: ProfileDraft; onChange: (v: ProfileDraft) => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const [picking, setPicking] = useState(false);
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...value, ...patch });

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets[0]) set({ photoUri: res.assets[0].uri });
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.photoRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('onboarding.profile.addPhoto')} onPress={pickPhoto}>
          <Avatar name={value.name || '?'} gradient={value.gradient} size={96} photoUri={value.photoUri} />
          <View style={[styles.camera, { backgroundColor: c.accent, borderColor: c.bg }]}>
            <Camera size={15} color={c.onAccent} strokeWidth={2.2} />
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Pressable onPress={pickPhoto} hitSlop={6}>
            <Text style={[type.bodyStrong, { color: c.text }]}>{value.photoUri ? t('onboarding.profile.changePhoto') : t('onboarding.profile.addPhoto')}</Text>
          </Pressable>
          <Text style={[type.footnote, { color: c.muted }]}>{t('onboarding.profile.photoHint')}</Text>
          {value.photoUri && <TextLink label={t('onboarding.profile.removePhoto')} onPress={() => set({ photoUri: undefined })} />}
        </View>
      </View>

      <FieldLabel label={t('onboarding.profile.name')} />
      <TextField
        value={value.name}
        onChangeText={(name) => set({ name })}
        placeholder={t('onboarding.profile.namePlaceholder')}
        maxLength={24}
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        accessibilityLabel={t('onboarding.profile.name')}
      />

      <FieldLabel label={t('onboarding.profile.affiliationOptional')} />
      <Pressable accessibilityRole="button" accessibilityLabel={t('onboarding.profile.affiliation')} onPress={() => setPicking(true)}>
        <InputBox focused={picking}>
          <Text style={[onest('medium', 16), { color: value.affiliation ? c.text : c.muted, flex: 1 }]} numberOfLines={1}>
            {value.affiliation || t('onboarding.profile.affiliationPlaceholder')}
          </Text>
          <ChevronDown size={20} color={c.muted} />
        </InputBox>
      </Pressable>

      <FieldLabel
        label={t('onboarding.profile.talkAbout')}
        right={
          <Text style={[type.footnote, { color: c.muted }]}>
            {value.talkAbout.length} / {TALK_MAX}
          </Text>
        }
      />
      <TextField
        value={value.talkAbout}
        onChangeText={(talkAbout) => set({ talkAbout })}
        placeholder={t('onboarding.profile.talkPlaceholder')}
        maxLength={TALK_MAX}
        accessibilityLabel={t('onboarding.profile.talkAbout')}
      />
      <View style={styles.ideas}>
        <Text style={[onest('regular', 12), { color: c.muted }]}>{t('onboarding.profile.ideas')}</Text>
        {IDEAS.map((key) => {
          const idea = t(`onboarding.profile.idea.${key}`);
          return <IdeaChip key={key} label={idea} onPress={() => set({ talkAbout: idea })} />;
        })}
      </View>

      <AffiliationSheet visible={picking} value={value.affiliation} onClose={() => setPicking(false)} onPick={(affiliation) => set({ affiliation })} />
    </View>
  );
}

function AffiliationSheet({
  visible,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  value: string;
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  const { c } = useTheme();
  const { t } = useT();
  const [custom, setCustom] = useState('');
  const pick = (v: string) => {
    onPick(v);
    setCustom('');
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Sheet onClose={onClose} maxHeight="80%">
          <Text style={[type.title2, { color: c.text }]}>{t('onboarding.profile.affiliation')}</Text>
          <View style={[styles.list, { backgroundColor: c.surface2 }]}>
            {AFFILIATIONS.map((key) => t(`onboarding.profile.affiliations.${key}`)).map((a, i) => (
              <Pressable
                key={a}
                onPress={() => pick(a)}
                style={({ pressed }) => [styles.option, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[onest('medium', 16), { color: c.text, flex: 1 }]}>{a}</Text>
                {value === a && <Check size={18} color={c.text} strokeWidth={2.5} />}
              </Pressable>
            ))}
          </View>
          <FieldLabel label={t('onboarding.profile.affiliationCustom')} />
          <TextField
            value={custom}
            onChangeText={setCustom}
            placeholder={t('onboarding.profile.affiliationCustomPlaceholder')}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={() => custom.trim() && pick(custom.trim())}
          />
          <Button label={t('common.done')} disabled={!custom.trim()} onPress={() => pick(custom.trim())} />
          {!!value && <Button label={t('onboarding.profile.affiliationNone')} variant="ghost" onPress={() => pick('')} />}
        </Sheet>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: -4 },
  list: { borderRadius: 16, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 16 },
});
