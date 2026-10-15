import { Pressable, StyleSheet, View } from 'react-native';

import { Button, goBack, Radio, Sheet } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { LANGS, useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

// M16c "Language": bottom sheet over M16b Settings (a centred dialog on wide web), styled like the M17
// sheet — Onest Bold 18 title, bg-coloured radio group (radius 18, 16×13 rows), 56 pt "Done".
// The language applies immediately; the whole app re-renders.
export default function LanguageScreen() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { dispatch } = useStore();
  const close = () => goBack('/me');

  return (
    <Sheet onClose={close} footer={(done) => <Button label={t('common.done')} onPress={done} />}>
      <View style={styles.body}>
        <View style={{ gap: 2 }}>
          <Text style={[onest('bold', 18, 23), { color: c.text }]}>{t('profile.language.title')}</Text>
          <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{t('profile.language.note')}</Text>
        </View>
        <View accessibilityRole="radiogroup" style={[styles.list, { backgroundColor: c.bg }]}>
          {LANGS.map((l, i) => {
            const on = l.id === lang;
            return (
              <Pressable
                key={l.id}
                accessibilityRole="radio"
                accessibilityLabel={l.native}
                aria-checked={on}
                onPress={() => dispatch({ type: 'setLanguage', language: l.id })}
                style={({ pressed }) => [
                  styles.row,
                  i < LANGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line },
                  pressed && { backgroundColor: c.surface2 },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[onest('medium', 15, 19), { color: c.text }]}>{l.native}</Text>
                  <Text style={[onest('regular', 12, 16), { color: c.muted }]}>{l.label}</Text>
                </View>
                <Radio selected={on} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, marginTop: -5 },
  list: { borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
});
