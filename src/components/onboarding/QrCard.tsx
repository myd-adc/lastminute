import { Linking, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { onest, useTheme } from '@/theme';

import { QrPlaceholder } from './QrPlaceholder';

const APP_STORE = 'https://apps.apple.com/';
const GOOGLE_PLAY = 'https://play.google.com/store';

// W01 "Better on your phone" block: QR, one line on why, store pills.
export function QrCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={[styles.card, { backgroundColor: c.bg }, style]}>
      <QrPlaceholder size={132} />
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={[onest('bold', 16), { color: c.text }]}>{t('onboarding.login.phoneBetter')}</Text>
        <Text style={[onest('regular', 13, 18), { color: c.muted }]}>{t('onboarding.login.phoneBetterText')}</Text>
        <View style={styles.stores}>
          <StorePill label="App Store" url={APP_STORE} />
          <StorePill label="▶ Google Play" url={GOOGLE_PLAY} />
        </View>
      </View>
    </View>
  );
}

function StorePill({ label, url }: { label: string; url: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => [styles.store, { backgroundColor: c.surface2 }, pressed && { opacity: 0.8 }]}
    >
      <Text style={[onest('semibold', 13), { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 20, padding: 20, borderRadius: 20 },
  stores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  store: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
});
