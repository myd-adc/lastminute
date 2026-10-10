import { Globe } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { goBack, Header, List, Radio, Screen } from '@/components/ui';
import { LANGS, useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

// M16c «Мова» / «Language»: pick the app language; the whole app re-renders immediately.
export default function LanguageScreen() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { dispatch } = useStore();
  const wide = useIsWide();

  return (
    <Screen contentStyle={wide ? styles.wide : undefined}>
      <Header onBack={() => goBack('/me')} />
      <View style={styles.titleRow}>
        <Globe size={24} color={c.text} strokeWidth={2} />
        <Text style={[type.title, { color: c.text, flex: 1 }]}>{t('profile.language.title')}</Text>
      </View>
      <List>
        <View accessibilityRole="radiogroup">
          {LANGS.map((l, i) => {
            const on = l.id === lang;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="radio"
                accessibilityLabel={l.native}
                accessibilityState={{ selected: on }}
                onPress={() => dispatch({ type: 'setLanguage', language: l.id })}
                style={({ pressed }) => [
                  styles.row,
                  i < LANGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line },
                  pressed && { backgroundColor: c.surface2 },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[onest('semibold', 16), { color: c.text }]}>{l.native}</Text>
                  <Text style={[type.footnote, { color: c.muted }]}>{l.label}</Text>
                </View>
                <Radio selected={on} />
              </Pressable>
            );
          })}
        </View>
      </List>
      <Text style={[type.footnote, { color: c.muted }]}>{t('profile.language.note')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 12 },
});
