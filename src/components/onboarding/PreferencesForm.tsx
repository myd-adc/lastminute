import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/ui';
import { goesWithOptions, interests, vibes } from '@/data/mock';
import type { GoesWith, InterestId, Vibe } from '@/data/types';
import { useT } from '@/i18n';
import { onest, useTheme } from '@/theme';

export const MIN_INTERESTS = 3;

// «Інді» has the same 🎸 as «Концерти» and is a genre rather than a format, so the picker leaves it out (as in M04).
// A function, not a constant: `interests` is a live binding that switches with the language.
export const pickableInterests = () => interests.filter((i) => i.id !== 'indie');

export type PreferencesDraft = { interests: InterestId[]; vibe: Vibe | null; goesWith: GoesWith | null };

export const preferencesValid = (p: PreferencesDraft) => p.interests.length >= MIN_INTERESTS;

// M04 body, shared by onboarding (interests) and «Вподобання і сцени».
export function PreferencesForm({ value, onChange }: { value: PreferencesDraft; onChange: (v: PreferencesDraft) => void }) {
  const toggle = (id: InterestId) =>
    onChange({ ...value, interests: value.interests.includes(id) ? value.interests.filter((x) => x !== id) : [...value.interests, id] });
  const { t } = useT();
  return (
    <View style={{ gap: 24 }}>
      <View style={styles.chips}>
        {pickableInterests().map((i) => (
          <Chip key={i.id} label={`${i.emoji} ${i.label}`} selected={value.interests.includes(i.id)} onPress={() => toggle(i.id)} />
        ))}
      </View>
      <Group title={t('onboarding.interests.vibe')}>
        {vibes.map((v) => (
          <Chip key={v.id} label={`${v.emoji} ${v.label}`} selected={value.vibe === v.id} onPress={() => onChange({ ...value, vibe: v.id })} />
        ))}
      </Group>
      <Group title={t('onboarding.interests.goesWith')}>
        {goesWithOptions.map((g) => (
          <Chip key={g.id} label={`${g.emoji} ${g.label}`} selected={value.goesWith === g.id} onPress={() => onChange({ ...value, goesWith: g.id })} />
        ))}
      </Group>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text style={[onest('semibold', 16), { color: c.text }]}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
