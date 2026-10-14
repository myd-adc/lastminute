import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { BackTitle } from '@/components/profile/BackTitle';
import { goBack, Screen } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { onest, type, useTheme } from '@/theme';

const rules = [
  { emoji: '🪞', key: 'symmetry' },
  { emoji: '🤝', key: 'consent' },
  { emoji: '⏳', key: 'day' },
  { emoji: '🙅', key: 'notDating' },
  { emoji: '🛡️', key: 'safety' },
] as const;

// "Community rules" — short and friendly, linked from the profile, settings and the report sheet.
export default function RulesScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const wide = useIsWide();
  const number = t('profile.emergencyNumber');
  return (
    <Screen contentStyle={[styles.content, wide && styles.wide]}>
      <BackTitle title={t('profile.rules.title')} onBack={() => goBack('/me')} style={styles.header} />
      <Text style={[type.body, { color: c.muted }]}>{t('profile.rules.intro')}</Text>
      {rules.map((r) => (
        <View key={r.key} style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={[styles.emoji, { backgroundColor: c.surface2 }]}>
            <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.headline, { color: c.text }]}>{t(`profile.rules.${r.key}Title`)}</Text>
            <Text style={[type.subhead, { color: c.muted }]}>{t(`profile.rules.${r.key}Text`)}</Text>
          </View>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openURL(`tel:${number}`)}
        style={({ pressed }) => [styles.card, { backgroundColor: c.dangerSoft }, pressed && { opacity: 0.85 }]}
      >
        <Text style={{ fontSize: 22 }}>🚨</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[type.headline, { color: c.text }]}>{t('profile.rules.emergencyTitle', { number })}</Text>
          <Text style={[type.subhead, { color: c.muted }]}>
            {t('profile.rules.emergencyText')} <Text style={[onest('semibold', 14), { color: c.danger }]}>{t('profile.rules.call')}</Text>
          </Text>
        </View>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Same header as M16b (no dedicated frame).
  content: { gap: 12 },
  header: { marginTop: -2 },
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 18, alignItems: 'flex-start' },
  emoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
