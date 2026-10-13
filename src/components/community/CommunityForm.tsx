import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Field, TextField } from '@/components/onboarding/kit';
import { Chip, Gradient } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { type GradientId, gradientIds } from '@/theme/palette';
import { onest, type, useTheme } from '@/theme';

import { DOMAIN_RE, normalizeDomain } from './text';

export type CommunityFormValue = {
  name: string;
  description: string;
  gradient: GradientId;
  access: 'open' | 'domain';
  domain: string;
};

export const communityFormValid = (v: CommunityFormValue) =>
  v.name.trim().length >= 2 && (v.access === 'open' || DOMAIN_RE.test(normalizeDomain(v.domain)));

export const toDraft = (v: CommunityFormValue) => ({
  name: v.name.trim(),
  description: v.description.trim(),
  gradient: v.gradient,
  emailDomain: v.access === 'domain' ? normalizeDomain(v.domain) : null,
});

// M20 / M22 body: cover colour, name, description, who can join and the e-mail domain.
export function CommunityForm({
  value,
  onChange,
  editing,
}: {
  value: CommunityFormValue;
  onChange: (v: CommunityFormValue) => void;
  editing?: boolean;
}) {
  const { c } = useTheme();
  const { t } = useT();
  const set = (patch: Partial<CommunityFormValue>) => onChange({ ...value, ...patch });
  const domain = normalizeDomain(value.domain);
  const badDomain = value.access === 'domain' && !!domain && !DOMAIN_RE.test(domain);
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.cover}>
        <Gradient id={value.gradient} style={styles.avatar}>
          <Text style={[onest('bold', 34), styles.initial]}>{value.name.trim()[0]?.toUpperCase()}</Text>
        </Gradient>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{t('community.form.cover')}</Text>
          <View style={styles.swatches}>
            {gradientIds.map((g) => (
              <Pressable
                key={g}
                accessibilityRole="radio"
                accessibilityState={{ checked: g === value.gradient }}
                onPress={() => set({ gradient: g })}
                hitSlop={4}
              >
                <Gradient
                  id={g}
                  style={[
                    styles.swatch,
                    g === value.gradient && {
                      borderColor: c.text,
                      borderWidth: 2,
                    },
                  ]}
                >
                  {g === value.gradient && <Check size={14} color="#fff" strokeWidth={3} />}
                </Gradient>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Field label={t('community.form.name')}>
        <TextField
          accessibilityLabel={t('community.form.name')}
          value={value.name}
          onChangeText={(name) => set({ name: name.slice(0, 40) })}
          placeholder={t('community.form.namePlaceholder')}
          boxStyle={styles.input}
        />
      </Field>
      <Field label={t('community.form.description')}>
        <TextField
          accessibilityLabel={t('community.form.description')}
          value={value.description}
          onChangeText={(description) => set({ description: description.slice(0, 200) })}
          placeholder={t('community.form.descriptionPlaceholder')}
          multiline
          boxStyle={[styles.input, styles.multiline]}
        />
      </Field>

      <View style={{ gap: 8 }}>
        <Text style={[onest('medium', 13, 17), { color: c.muted }]}>{t('community.form.access')}</Text>
        <View style={styles.chips}>
          <Chip label={t('community.form.anyone')} selected={value.access === 'open'} onPress={() => set({ access: 'open' })} />
          <Chip label={t('community.form.domainOnly')} selected={value.access === 'domain'} onPress={() => set({ access: 'domain' })} />
        </View>
      </View>

      {value.access === 'domain' && (
        <View style={{ gap: 8 }}>
          <Field label={t('community.form.domain')}>
            <TextField
              accessibilityLabel={t('community.form.domain')}
              value={value.domain}
              onChangeText={(d) => set({ domain: d })}
              placeholder={t('community.form.domainPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              left={<Text style={[onest('medium', 16), { color: c.muted }]}>@</Text>}
              boxStyle={styles.input}
            />
          </Field>
          <Text style={[type.footnote, { color: badDomain ? c.danger : c.muted }]}>
            {badDomain ? t('community.form.domainInvalid') : editing ? t('community.form.domainHintEdit') : t('community.form.domainHint')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#fff' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 54 },
  // Keeps one line of text where a single-line field has it; longer text grows the box.
  multiline: { paddingVertical: 16 },
});
