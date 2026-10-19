import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { goesWithOptions, interests, vibes } from '@/data/mock';
import type { GoesWith, InterestId, Vibe } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { onest, useTheme } from '@/theme';

// One is enough: not everyone has several hobbies, and three blocked people at the last onboarding step.
export const MIN_INTERESTS = 1;

// "Indie" has the same 🎸 as "Concerts" and is a genre rather than a format, so the picker leaves it out (as in M04).
// A function, not a constant: `interests` is a live binding that switches with the language.
export const pickableInterests = () => interests.filter((i) => i.id !== 'indie');

export type PreferencesDraft = { interests: InterestId[]; vibe: Vibe | null; goesWith: GoesWith | null };

export const preferencesValid = (p: PreferencesDraft) => p.interests.length >= MIN_INTERESTS;

// M04 body, shared by onboarding (interests) and "Interests".
// Figma: 22 pt between sections and 8 pt under a section title on phones (M04); 30 pt and 12 pt on wide web (W02).
export function PreferencesForm({ value, onChange }: { value: PreferencesDraft; onChange: (v: PreferencesDraft) => void }) {
  const toggle = (id: InterestId) =>
    onChange({ ...value, interests: value.interests.includes(id) ? value.interests.filter((x) => x !== id) : [...value.interests, id] });
  const { t } = useT();
  const wide = useIsWide();
  return (
    <View style={{ gap: wide ? 30 : 22 }}>
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
  const wide = useIsWide();
  return (
    <View style={{ gap: wide ? 12 : 8 }}>
      <Text style={[onest('semibold', 17, 22), { color: c.text }]}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
