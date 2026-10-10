import type { ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getScene } from '@/data/mock';
import { t as tr, useT } from '@/i18n';
import { eventsCount, people } from '@/lib/time';
import { useNow } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

import { HeroBlobs } from './HeroBlobs';
import { LanguagePill, Logo, TextLink } from './kit';
import { sceneWeekEvents } from './SceneForm';

const FEATURES = [
  { icon: '👋', key: 'onboarding.wide.features.see' },
  { icon: '🔒', key: 'onboarding.wide.features.mutual' },
  { icon: '⏳', key: 'onboarding.wide.features.vanish' },
] as const;

// Built at call time so the subject follows the current language.
export const partnerMail = () => `mailto:partners@lastminute.app?subject=${encodeURIComponent(tr('onboarding.wide.partnerSubject'))}`;

// W01 wide web: hero half with gradient blobs on the left, the auth panel (login / code) on the right.
export function AuthSplit({ children, languagePill }: { children: ReactNode; languagePill?: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const now = useNow();
  const ucu = getScene('ucu');
  const { width } = useWindowDimensions();
  const heroSize = Math.round(Math.min(72, Math.max(44, width * 0.042)));
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.hero}>
        <HeroBlobs variant="wide" />
        <Logo />
        <View style={{ flex: 1 }} />
        <Text style={[display(heroSize, Math.round(heroSize * 1.1)), { color: c.text }]}>{t('onboarding.hero')}</Text>
        <Text style={[onest('regular', 18, 26), { color: c.muted, maxWidth: 600, marginTop: 20 }]}>
          {t('onboarding.wide.tagline')}
        </Text>
        <View style={{ gap: 18, marginTop: 36 }}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.feature}>
              <View style={[styles.tile, { backgroundColor: c.surface }]}>
                <Text style={{ fontSize: 20 }}>{f.icon}</Text>
              </View>
              <Text style={[onest('medium', 15, 20), { color: c.text, flex: 1 }]}>{t(f.key)}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1.3 }} />
        <Text style={[type.footnote, { color: c.muted }]}>
          {t('onboarding.wide.sceneNow', { scene: ucu.name, events: eventsCount(sceneWeekEvents('ucu', now)), people: people(ucu.people) })}
        </Text>
      </View>

      <View style={[styles.panel, { backgroundColor: c.surface }]}>
        {languagePill && <LanguagePill style={styles.lang} />}
        <ScrollView contentContainerStyle={styles.panelScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.panelInner}>{children}</View>
        </ScrollView>
        <View style={styles.partner}>
          <View style={styles.panelInner}>
            <TextLink label={t('onboarding.wide.partner')} onPress={() => Linking.openURL(partnerMail())} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  hero: { flex: 1.4, paddingHorizontal: 64, paddingVertical: 48, overflow: 'hidden' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  panel: { flex: 1, minWidth: 460 },
  panelScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 64, paddingVertical: 48 },
  panelInner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  partner: { paddingHorizontal: 64, paddingBottom: 48 },
  lang: { position: 'absolute', top: 32, right: 40, zIndex: 1 },
});
