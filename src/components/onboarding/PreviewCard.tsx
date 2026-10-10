import { Lock } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Gradient, Pill } from '@/components/ui';
import { getInterest } from '@/data/mock';
import type { InterestId } from '@/data/types';
import { useT } from '@/i18n';
import { display, onest, type, useTheme, type GradientId } from '@/theme';

export type PreviewPerson = {
  name: string;
  affiliation: string;
  talkAbout: string;
  gradient: GradientId;
  photoUri?: string;
  interests: InterestId[];
  sceneName?: string;
  solo?: boolean;
};

// W02 right panel: «Так тебе бачитимуть на події» — a live, smaller version of the M09 person card.
export function PreviewCard({ person }: { person: PreviewPerson }) {
  const { c } = useTheme();
  const { t } = useT();
  const name = person.name.trim() || t('onboarding.preview.namePlaceholder');
  const meta = [person.sceneName, person.affiliation.trim()].filter(Boolean).join(' · ');
  const tags = person.interests.map(getInterest).filter((i) => !!i);
  return (
    <View style={{ gap: 14 }}>
      <Text style={[type.footnoteStrong, { color: c.muted }]}>{t('onboarding.preview.title')}</Text>
      <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.line }]}>
        <View style={styles.photo}>
          {person.photoUri ? (
            <Image source={{ uri: person.photoUri }} style={StyleSheet.absoluteFill} />
          ) : (
            <Gradient id={person.gradient} style={[StyleSheet.absoluteFill, styles.center]}>
              <Text style={[display(110, 120), { color: '#0B0B10' }]}>{name.charAt(0).toUpperCase()}</Text>
            </Gradient>
          )}
          {person.solo && <Pill label={t('onboarding.preview.solo')} tone="bg" style={styles.soloPill} />}
        </View>
        <View style={styles.body}>
          <Text style={[display(20, 26), { color: c.text }]} numberOfLines={1}>
            {name}
          </Text>
          {!!meta && (
            <Text style={[type.footnote, { color: c.muted, marginTop: -6 }]} numberOfLines={1}>
              {meta}
            </Text>
          )}
          {tags.length > 0 && (
            <View style={styles.tags}>
              {tags.slice(0, 5).map((tag) => (
                <Pill key={tag.id} label={`${tag.emoji} ${tag.label}`} weight="medium" />
              ))}
            </View>
          )}
          {!!person.talkAbout.trim() && (
            <View style={[styles.talk, { backgroundColor: c.surface }]}>
              <Text style={[onest('medium', 12), { color: c.muted }]}>{t('onboarding.preview.talkAbout')}</Text>
              <Text style={[onest('semibold', 14, 19), { color: c.text }]}>{person.talkAbout.trim()}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.note}>
        <Lock size={14} color={c.muted} style={{ marginTop: 2 }} />
        <Text style={[type.footnote, { color: c.muted, flex: 1 }]}>{t('onboarding.preview.note')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  photo: { height: 180, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  soloPill: { position: 'absolute', top: 12, left: 12 },
  body: { padding: 16, gap: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  talk: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  note: { flexDirection: 'row', gap: 8 },
});
