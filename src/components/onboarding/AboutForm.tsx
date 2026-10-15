import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, Sheet } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { SpokenLang } from '@/data/types';
import { useT } from '@/i18n';
import { onest, type, useTheme } from '@/theme';

import { Field, InputBox } from './kit';

export const SPOKEN_LANGS: SpokenLang[] = ['uk', 'en', 'pl', 'de', 'es', 'fr', 'other'];

// Nobody on an events app is under 14, and a 100-year span is more than enough.
const MIN_AGE = 14;
const MAX_AGE = 100;

export type AboutDraft = { birthYear?: number; languages?: SpokenLang[] };

export const aboutValid = (v: AboutDraft) => !!v.birthYear;

// M04b "A little about you": year of birth (needed for 18+ events) and the languages the person speaks.
export function AboutForm({ value, onChange }: { value: AboutDraft; onChange: (v: AboutDraft) => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const [picking, setPicking] = useState(false);
  const languages = value.languages ?? [];

  const toggle = (id: SpokenLang) =>
    onChange({ ...value, languages: languages.includes(id) ? languages.filter((l) => l !== id) : [...languages, id] });

  return (
    <View style={styles.form}>
      <Field label={t('onboarding.about.birthYear')}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('onboarding.about.birthYearPick')} onPress={() => setPicking(true)}>
          <InputBox focused={picking}>
            <Text style={[onest('medium', 16), { color: value.birthYear ? c.text : c.muted, flex: 1 }]}>
              {value.birthYear ?? t('onboarding.about.birthYearPlaceholder')}
            </Text>
            <ChevronDown size={18} color={c.muted} strokeWidth={2} />
          </InputBox>
        </Pressable>
      </Field>
      <Text style={[type.footnote, { color: c.muted, marginTop: -6 }]}>{t('onboarding.about.birthYearNote')}</Text>

      <Field label={t('onboarding.about.languages')}>
        <View style={styles.chips}>
          {SPOKEN_LANGS.map((id) => (
            <Chip key={id} label={t(`common.languages.${id}`)} selected={languages.includes(id)} onPress={() => toggle(id)} />
          ))}
        </View>
      </Field>
      <Text style={[type.footnote, { color: c.muted, marginTop: -6 }]}>{t('onboarding.about.languagesNote')}</Text>

      <YearSheet visible={picking} value={value.birthYear} onClose={() => setPicking(false)} onPick={(birthYear) => onChange({ ...value, birthYear })} />
    </View>
  );
}

function YearSheet({ visible, value, onPick, onClose }: { visible: boolean; value?: number; onPick: (v: number) => void; onClose: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => thisYear - MIN_AGE - i);
  const pick = (v: number) => {
    onPick(v);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} maxHeight="80%">
      <Text style={[type.title2, { color: c.text }]}>{t('onboarding.about.birthYearPick')}</Text>
      <View style={[styles.list, { backgroundColor: c.surface2 }]}>
        {years.map((y, i) => (
          <Pressable
            key={y}
            accessibilityRole="button"
            onPress={() => pick(y)}
            style={({ pressed }) => [styles.option, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[onest('medium', 16), { color: c.text, flex: 1 }]}>{y}</Text>
            {value === y && <Check size={18} color={c.text} strokeWidth={2.5} />}
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { borderRadius: 16, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 16 },
});
