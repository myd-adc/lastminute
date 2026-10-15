import { Camera, Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Sheet } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { usernameAvailable } from '@/api/auth';
import { isLive } from '@/api/client';
import { pickSquareImage } from '@/lib/pickSquareImage';
import { cleanUsernameInput, isValidUsername, suggestUsername } from '@/lib/username';
import type { Me } from '@/store/AppStore';
import { gradientIds, onest, type, useTheme } from '@/theme';

import { accentInk, Field, IdeaChip, InputBox, TextField, TextLink } from './kit';

export const TALK_MAX = 80;

export type ProfileDraft = Me;

export const randomGradient = () => gradientIds[Math.floor(Math.random() * gradientIds.length)];

export const emptyProfile = (email?: string | null): ProfileDraft => ({
  name: '',
  username: suggestUsername('', email),
  affiliation: '',
  talkAbout: '',
  gradient: randomGradient(),
});

export type UsernameStatus = 'invalid' | 'checking' | 'free' | 'taken';

// The server is asked once typing pauses; the demo has nobody to clash with.
export function useUsernameStatus(username: string | undefined): UsernameStatus {
  const u = username ?? '';
  const valid = isValidUsername(u);
  const [checked, setChecked] = useState<{ u: string; free: boolean } | null>(null);
  useEffect(() => {
    if (!valid || !isLive) return;
    let live = true;
    const timer = setTimeout(() => {
      usernameAvailable(u).then((free) => live && setChecked({ u, free }));
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [u, valid]);
  if (!valid) return 'invalid';
  if (!isLive) return 'free';
  if (checked?.u !== u) return 'checking';
  return checked.free ? 'free' : 'taken';
}

export const isProfileValid = (p: ProfileDraft, username: UsernameStatus) => p.name.trim().length > 0 && username === 'free';

// Trims the draft before it goes into the store.
export const cleanProfile = (p: ProfileDraft): Me => ({
  ...p,
  name: p.name.trim(),
  affiliation: p.affiliation.trim(),
  talkAbout: p.talkAbout.trim().slice(0, TALK_MAX),
});

// Keys into onboarding.profile.affiliations / .idea; the picked text is stored in the current language.
// Broad starting points only — anything specific («Дизайн, 2 курс») goes through the free-text field.
const AFFILIATIONS = ['studying', 'working', 'it', 'creative', 'teaching', 'freelance'] as const;

const IDEAS = ['concert', 'reading', 'boardGame'] as const;

// M03 form, shared by onboarding (profile-setup) and "Edit profile".
// `affiliation` is off during onboarding: it is optional, easy to get wrong, and only slows the first screen down.
export function ProfileForm({
  value,
  onChange,
  usernameStatus,
  email,
  affiliation,
}: {
  value: ProfileDraft;
  onChange: (v: ProfileDraft) => void;
  usernameStatus: UsernameStatus;
  email?: string | null;
  affiliation?: boolean;
}) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const [picking, setPicking] = useState(false);
  // The suggestion follows the name until the user edits the username themselves.
  const usernameTouched = useRef(!!value.username && value.username !== suggestUsername('', email));
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...value, ...patch });
  const setName = (name: string) => set(usernameTouched.current ? { name } : { name, username: suggestUsername(name, email) || value.username });
  const username = value.username ?? '';
  const usernameError =
    usernameStatus === 'taken'
      ? t('onboarding.profile.usernameTaken', { suggestion: `${username.slice(0, 19)}2` })
      : usernameStatus === 'invalid' && username.length > 0
        ? t('onboarding.profile.usernameRules')
        : null;

  const pickPhoto = async () => {
    const uri = await pickSquareImage();
    if (uri) set({ photoUri: uri });
  };

  // M03: 12 pt between blocks, 8 pt between a label and its input, 54 pt inputs.
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.photoRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('onboarding.profile.addPhoto')} onPress={pickPhoto}>
          <Avatar name={value.name || '?'} gradient={value.gradient} size={88} photoUri={value.photoUri} />
          <View style={[styles.camera, { backgroundColor: c.accent, borderColor: c.bg }]}>
            <Camera size={16} color={c.onAccent} strokeWidth={2} />
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Pressable onPress={pickPhoto} hitSlop={6}>
            <Text style={[onest('semibold', 15, 19), { color: c.text }]}>
              {value.photoUri ? t('onboarding.profile.changePhoto') : t('onboarding.profile.addPhoto')}
            </Text>
          </Pressable>
          <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{t('onboarding.profile.photoHint')}</Text>
          {value.photoUri && <TextLink label={t('onboarding.profile.removePhoto')} onPress={() => set({ photoUri: undefined })} />}
        </View>
      </View>

      {/* M03: "Name" and "Username" share a row; ✓ in the accent ink once the username is free. */}
      <View style={styles.nameRow}>
        <View style={styles.half}>
          <Field label={t('onboarding.profile.name')}>
            <TextField
              value={value.name}
              onChangeText={setName}
              placeholder={t('onboarding.profile.namePlaceholder')}
              maxLength={24}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              accessibilityLabel={t('onboarding.profile.name')}
            />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label={t('onboarding.profile.username')}>
            <TextField
              value={username}
              onChangeText={(u) => {
                usernameTouched.current = true;
                set({ username: cleanUsernameInput(u) });
              }}
              placeholder={t('onboarding.profile.usernamePlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              accessibilityLabel={t('onboarding.profile.username')}
              boxStyle={usernameError ? { borderColor: c.danger } : undefined}
              left={<Text style={[onest('medium', 16), { color: c.muted, marginRight: -8 }]}>@</Text>}
              right={
                usernameStatus === 'free' ? (
                  <Check size={18} color={accentInk(c, scheme)} strokeWidth={2.5} accessibilityLabel={t('onboarding.profile.usernameFree')} />
                ) : undefined
              }
            />
          </Field>
        </View>
      </View>
      {usernameError && <Text style={[type.footnote, { color: c.danger, marginTop: -4 }]}>{usernameError}</Text>}

      {affiliation && (
        <Field label={t('onboarding.profile.affiliationOptional')}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('onboarding.profile.affiliation')} onPress={() => setPicking(true)}>
            <InputBox focused={picking}>
              <Text style={[onest('medium', 16), { color: value.affiliation ? c.text : c.muted, flex: 1 }]} numberOfLines={1}>
                {value.affiliation || t('onboarding.profile.affiliationPlaceholder')}
              </Text>
              <ChevronDown size={18} color={c.muted} strokeWidth={2} />
            </InputBox>
          </Pressable>
        </Field>
      )}

      <Field label={t('onboarding.profile.talkAbout')} right={`${value.talkAbout.length} / ${TALK_MAX}`}>
        <TextField
          value={value.talkAbout}
          onChangeText={(talkAbout) => set({ talkAbout })}
          placeholder={t('onboarding.profile.talkPlaceholder')}
          maxLength={TALK_MAX}
          accessibilityLabel={t('onboarding.profile.talkAbout')}
        />
      </Field>
      <View style={styles.ideas}>
        <Text style={[onest('medium', 13), { color: c.muted }]}>{t('onboarding.profile.ideas')}</Text>
        {IDEAS.map((key) => {
          const idea = t(`onboarding.profile.idea.${key}`);
          return <IdeaChip key={key} label={idea} onPress={() => set({ talkAbout: idea })} />;
        })}
      </View>

      <AffiliationSheet
        visible={!!affiliation && picking}
        value={value.affiliation}
        onClose={() => setPicking(false)}
        onPick={(affiliation) => set({ affiliation })}
      />
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
    <Sheet visible={visible} onClose={onClose} maxHeight="80%">
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
      <Field label={t('onboarding.profile.affiliationCustom')}>
        <TextField
          value={custom}
          onChangeText={setCustom}
          placeholder={t('onboarding.profile.affiliationCustomPlaceholder')}
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={() => custom.trim() && pick(custom.trim())}
        />
      </Field>
      <Button label={t('common.done')} disabled={!custom.trim()} onPress={() => pick(custom.trim())} />
      {!!value && <Button label={t('onboarding.profile.affiliationNone')} variant="ghost" onPress={() => pick('')} />}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  nameRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, minWidth: 0 },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  list: { borderRadius: 16, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 16 },
});
