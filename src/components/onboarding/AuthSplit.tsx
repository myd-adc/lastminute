import { Lock } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t as tr, useT } from '@/i18n';
import { display, onest, useTheme } from '@/theme';

import { HeroBlobs } from './HeroBlobs';
import { accentInk, LanguagePill, Logo, TextLink } from './kit';

// Figma: 👋 and ⏳ are emoji, the middle tile is a lock icon in the accent ink.
const FEATURES = [
  { icon: '👋', key: 'onboarding.wide.features.see' },
  { icon: 'lock', key: 'onboarding.wide.features.mutual' },
  { icon: '⏳', key: 'onboarding.wide.features.vanish' },
] as const;

// Built at call time so the subject follows the current language.
export const partnerMail = () => `mailto:partners@lastminute.software?subject=${encodeURIComponent(tr('onboarding.wide.partnerSubject'))}`;

// W01 wide web: hero half (840 of 1440) with the three glows on the left, the 600 pt auth panel (login / code) on the right.
// Logo at 48, hero block at y 200; the 130 : 146 flexible gaps keep that rhythm.
export function AuthSplit({ children, languagePill }: { children: ReactNode; languagePill?: boolean }) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { width } = useWindowDimensions();
  const heroSize = Math.round(Math.min(64, Math.max(44, width * 0.0444)));
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.hero}>
        <HeroBlobs variant="wide" />
        <Logo />
        <View style={[styles.flexGap, { flexGrow: 130 }]} />
        <Text style={[display(heroSize, Math.round(heroSize * 1.04)), { letterSpacing: -heroSize * 0.04, color: c.text, maxWidth: 620 }]}>
          {t('onboarding.hero')}
        </Text>
        <Text style={[onest('regular', 18, 26), { color: c.text, maxWidth: 620, marginTop: 20 }]}>{t('onboarding.wide.tagline')}</Text>
        <View style={{ gap: 20, marginTop: 46, maxWidth: 620 }}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.feature}>
              <View style={[styles.tile, { backgroundColor: c.surface }]}>
                {f.icon === 'lock' ? <Lock size={20} color={accentInk(c, scheme)} strokeWidth={2} /> : <Text style={{ fontSize: 20 }}>{f.icon}</Text>}
              </View>
              <Text style={[onest('medium', 16, 20), { color: c.text, flex: 1 }]}>{t(f.key)}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.flexGap, { flexGrow: 146 }]} />
      </View>

      <View style={[styles.panel, { backgroundColor: c.surface }]}>
        {languagePill && <LanguagePill style={styles.lang} />}
        <ScrollView contentContainerStyle={styles.panelScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.panelInner}>{children}</View>
        </ScrollView>
        <View style={styles.partner}>
          <View style={styles.panelInner}>
            <TextLink label={t('onboarding.wide.partner')} size={14} onPress={() => Linking.openURL(partnerMail())} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  hero: { flex: 1.4, paddingHorizontal: 64, paddingVertical: 48, overflow: 'hidden' },
  flexGap: { flexBasis: 0, minHeight: 32 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  panel: { flex: 1, minWidth: 460 },
  panelScroll: { flexGrow: 1, paddingHorizontal: 80, paddingTop: 120, paddingBottom: 32 },
  panelInner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  partner: { paddingHorizontal: 80, paddingBottom: 46 },
  lang: { position: 'absolute', top: 40, right: 50, zIndex: 1 },
});
