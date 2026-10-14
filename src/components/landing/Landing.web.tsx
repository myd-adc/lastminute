import { router } from 'expo-router';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode, type RefObject } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { partnerMail } from '@/components/onboarding/AuthSplit';
import { HeroBlobs } from '@/components/onboarding/HeroBlobs';
import { LanguagePill, Logo, ThemeToggle } from '@/components/onboarding/kit';
import { QrCard } from '@/components/onboarding/QrCard';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { display, onest, useTheme, type Scheme } from '@/theme';

// W00 landing (Figma «W00 landing» / «· Light»): what LastMinute is, before the W01 sign-in.
// Plain DOM scroll container so Motion can drive the parallax from its scroll position.

const shots = {
  dark: {
    feed: require('../../../assets/landing/dark-hero-feed.webp'),
    room: require('../../../assets/landing/dark-hero-room.webp'),
    event: require('../../../assets/landing/dark-step-event.webp'),
    stepRoom: require('../../../assets/landing/dark-step-room.webp'),
    match: require('../../../assets/landing/dark-step-match.webp'),
    communities: require('../../../assets/landing/dark-communities.webp'),
  },
  light: {
    // The light feed export carries dark chips from the Figma copy; the poster reads the same on the dark one.
    feed: require('../../../assets/landing/dark-hero-feed.webp'),
    room: require('../../../assets/landing/light-hero-room.webp'),
    event: require('../../../assets/landing/light-step-event.webp'),
    stepRoom: require('../../../assets/landing/light-step-room.webp'),
    match: require('../../../assets/landing/light-step-match.webp'),
    communities: require('../../../assets/landing/light-communities.webp'),
  },
} satisfies Record<Scheme, Record<string, number>>;

const STEPS = [
  { key: 'pick', shot: 'event' },
  { key: 'see', shot: 'stepRoom' },
  { key: 'go', shot: 'match' },
] as const;

const PRINCIPLES = [
  { key: 'hidden', emoji: '🔒' },
  { key: 'consent', emoji: '🤝' },
  { key: 'vanish', emoji: '⏳' },
  { key: 'noLikes', emoji: '🙅' },
  { key: 'noLocation', emoji: '📍' },
  { key: 'block', emoji: '🛡' },
] as const;

const EXAMPLES = ['university', 'company', 'running', 'games'] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

// Figma phone shell: 265 × 574 at radius 30, drop shadow 0 30 60 rgba(0,0,0,.45).
const phone = { position: 'absolute', borderRadius: 30, boxShadow: '0 30px 60px rgba(0,0,0,0.45)' } as const;

type Section = 'how' | 'safety' | 'communities' | 'venues';

export function Landing() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const reduce = !!useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const how = useRef<HTMLDivElement>(null);
  const safety = useRef<HTMLDivElement>(null);
  const communities = useRef<HTMLDivElement>(null);
  const venues = useRef<HTMLDivElement>(null);
  const img = shots[scheme];

  const { scrollY } = useScroll({ container: scroller });
  // Hero parallax: glows sink and fade, the phones rise at two speeds, the copy fades as it leaves.
  const range = [0, 800];
  const glowY = useTransform(scrollY, range, reduce ? [0, 0] : [0, 120]);
  const glowOpacity = useTransform(scrollY, [0, 500], reduce ? [1, 1] : [1, 0]);
  const feedY = useTransform(scrollY, range, reduce ? [0, 0] : [0, -70]);
  const roomY = useTransform(scrollY, range, reduce ? [0, 0] : [0, -170]);
  const roomRotate = useTransform(scrollY, range, reduce ? [0, 0] : [0, -3]);
  const copyY = useTransform(scrollY, [0, 600], reduce ? [0, 0] : [0, 90]);
  const copyOpacity = useTransform(scrollY, [0, 500], reduce ? [1, 1] : [1, 0.15]);

  const go = (s: Section) =>
    ({ how, safety, communities, venues })[s].current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  const start = () => router.push('/login');

  return (
    <div ref={scroller} style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', backgroundColor: c.bg }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: `${c.bg}D9`, backdropFilter: 'blur(16px)' }}>
        <View style={[styles.wrap, styles.nav]}>
          <Logo />
          <View style={styles.navLinks}>
            {(['how', 'safety', 'communities', 'venues'] as const).map((s) => (
              <Pressable key={s} accessibilityRole="link" onPress={() => go(s)}>
                {({ hovered }) => <Text style={[onest('medium', 15), { color: hovered ? c.text : c.muted }]}>{t(`onboarding.landing.nav.${s}`)}</Text>}
              </Pressable>
            ))}
          </View>
          <View style={styles.navActions}>
            <ThemeToggle />
            <LanguagePill />
            <Button label={t('onboarding.landing.signIn')} variant="ghost" size="md" onPress={start} />
            <Button label={t('onboarding.landing.getStarted')} size="md" onPress={start} />
          </View>
        </View>
      </div>

      <View style={styles.hero}>
        <motion.div style={{ position: 'absolute', inset: 0, y: glowY, opacity: glowOpacity, pointerEvents: 'none' }}>
          <HeroBlobs variant="landing" />
        </motion.div>
        <View style={[styles.wrap, styles.heroRow]}>
          <motion.div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 620, y: copyY, opacity: copyOpacity }}>
            <Text style={[display(60, 66), { color: c.text }]}>{t('onboarding.landing.hero')}</Text>
            <Text style={[onest('regular', 19, 29), { color: c.muted, marginTop: 28, maxWidth: 560 }]}>{t('onboarding.landing.sub')}</Text>
            <View style={styles.ctas}>
              <Button label={t('onboarding.landing.getStarted')} onPress={start} />
              <Button label={t('onboarding.landing.nav.how')} variant="ghost" onPress={() => go('how')} />
            </View>
            <Text style={[onest('medium', 14), { color: c.muted, marginTop: 24 }]}>{t('onboarding.landing.note')}</Text>
          </motion.div>
          <View style={styles.stage} accessibilityLabel={t('onboarding.landing.phonesA11y')}>
            <motion.div style={{ ...phone, left: 0, top: 70, y: feedY }}>
              <Image source={img.feed} style={styles.heroShot} />
            </motion.div>
            <motion.div style={{ ...phone, left: 250, top: 0, y: roomY, rotate: roomRotate }}>
              <Image source={img.room} style={styles.heroShot} />
            </motion.div>
          </View>
        </View>
      </View>

      <div ref={how}>
        <View style={[styles.wrap, styles.section]}>
          <Title text={t('onboarding.landing.how.title')} />
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <Reveal key={s.key} root={scroller} index={i} style={{ flex: 1, minWidth: 0 }}>
                <View style={[styles.stepCard, { backgroundColor: c.surface, borderColor: c.line }]}>
                  <View style={[styles.badge, { backgroundColor: c.accent }]}>
                    <Text style={[display(16, 20), { color: c.onAccent }]}>{i + 1}</Text>
                  </View>
                  <Text style={[display(24, 30), { color: c.text }]}>{t(`onboarding.landing.how.${s.key}.title`)}</Text>
                  <Text style={[onest('regular', 16, 24), { color: c.muted }]}>{t(`onboarding.landing.how.${s.key}.body`)}</Text>
                  <View style={styles.stepShot}>
                    <Image source={img[s.shot]} style={styles.fill} />
                  </View>
                </View>
              </Reveal>
            ))}
          </View>
        </View>
      </div>

      <div ref={safety}>
        <View style={[styles.wrap, styles.section]}>
          <Title text={t('onboarding.landing.safety.title')} />
          <View style={styles.grid}>
            {PRINCIPLES.map((p, i) => (
              <Reveal key={p.key} root={scroller} index={i % 3} style={styles.cell}>
                <View style={[styles.principle, { backgroundColor: c.surface, borderColor: c.line }]}>
                  <Text style={{ fontSize: 34, lineHeight: 40 }}>{p.emoji}</Text>
                  <Text style={[onest('bold', 19, 24), { color: c.text }]}>{t(`onboarding.landing.safety.${p.key}.title`)}</Text>
                  <Text style={[onest('regular', 15, 22), { color: c.muted }]}>{t(`onboarding.landing.safety.${p.key}.body`)}</Text>
                </View>
              </Reveal>
            ))}
          </View>
        </View>
      </div>

      <div ref={communities}>
        <Communities root={scroller} shot={img.communities} reduce={reduce} />
      </div>

      <div ref={venues}>
        <View style={[styles.wrap, { paddingVertical: 48 }]}>
          <Reveal root={scroller} index={0}>
            <View style={[styles.band, { backgroundColor: c.surface2 }]}>
              <View style={{ flex: 1, gap: 12, maxWidth: 640 }}>
                <Text style={[display(32, 40), { color: c.text }]}>{t('onboarding.landing.venues.title')}</Text>
                <Text style={[onest('regular', 17, 26), { color: c.muted }]}>{t('onboarding.landing.venues.body')}</Text>
              </View>
              <Button label={t('onboarding.landing.venues.cta')} onPress={() => Linking.openURL(partnerMail())} />
            </View>
          </Reveal>
        </View>
      </div>

      <View style={[styles.wrap, styles.final]}>
        <Reveal root={scroller} index={0}>
          <Text style={[display(52, 60), { color: c.text, textAlign: 'center', maxWidth: 900 }]}>{t('onboarding.landing.final')}</Text>
        </Reveal>
        <View style={styles.finalRow}>
          <Button label={t('onboarding.landing.getStarted')} onPress={start} />
          <Text style={[onest('medium', 15), { color: c.muted }]}>{t('onboarding.landing.or')}</Text>
          <QrCard style={{ width: 440, backgroundColor: c.surface }} />
        </View>
      </View>

      <View style={[styles.footerLine, { borderTopColor: c.line }]}>
        <View style={[styles.wrap, styles.footer]}>
          <Logo />
          <View style={styles.navLinks}>
            <FooterLink label={t('onboarding.landing.footer.rules')} onPress={() => router.push('/rules')} />
            <FooterLink label={t('onboarding.landing.footer.partners')} onPress={() => Linking.openURL(partnerMail())} />
          </View>
          <Text style={[onest('regular', 14), { color: c.muted }]}>© 2026 LastMinute</Text>
        </View>
      </View>
    </div>
  );
}

function Communities({ root, shot, reduce }: { root: RefObject<HTMLDivElement | null>; shot: number; reduce: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const target = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: root, target, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, -80]);
  return (
    <div ref={target}>
      <View style={[styles.wrap, styles.section, styles.commRow]}>
        <View style={{ flex: 1, gap: 24, maxWidth: 600 }}>
          <Title text={t('onboarding.landing.communities.title')} />
          <Text style={[onest('regular', 18, 28), { color: c.muted, maxWidth: 560 }]}>{t('onboarding.landing.communities.body')}</Text>
          <View style={styles.chips}>
            {EXAMPLES.map((e) => (
              <View key={e} style={[styles.chip, { backgroundColor: c.surface2 }]}>
                <Text style={[onest('semibold', 14), { color: c.text }]}>{t(`onboarding.landing.communities.examples.${e}`)}</Text>
              </View>
            ))}
          </View>
        </View>
        <motion.div style={{ y }}>
          <Image source={shot} style={styles.commShot} />
        </motion.div>
      </View>
    </div>
  );
}

function Title({ text }: { text: string }) {
  const { c } = useTheme();
  return <Text style={[display(44, 52), { color: c.text, maxWidth: 820 }]}>{text}</Text>;
}

// Fades and lifts a block the first time it scrolls into view; staggered by `index`.
function Reveal({ root, index, style, children }: { root: RefObject<HTMLDivElement | null>; index: number; style?: object; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', ...style }}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ root, once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress}>
      {({ hovered }) => <Text style={[onest('medium', 14), { color: hovered ? c.text : c.muted }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The page scrolls in a plain div, so centre with auto margins rather than alignSelf.
  wrap: { width: '100%', maxWidth: 1296, marginHorizontal: 'auto', paddingHorizontal: 48 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  navLinks: { flexDirection: 'row', gap: 32 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hero: { position: 'relative', overflow: 'hidden' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 64, paddingTop: 72, paddingBottom: 112 },
  ctas: { flexDirection: 'row', gap: 12, marginTop: 36 },
  stage: { width: 520, height: 640 },
  heroShot: { width: 265, height: 574, borderRadius: 30 },
  section: { paddingTop: 96, paddingBottom: 24, gap: 48 },
  steps: { flexDirection: 'row', gap: 24 },
  stepCard: { flex: 1, borderRadius: 28, borderWidth: 1, paddingTop: 28, paddingHorizontal: 28, gap: 14, overflow: 'hidden' },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  // Pinned to the card bottom so the three phones line up whatever the text length above them.
  stepShot: { width: '100%', aspectRatio: 328 / 380, marginTop: 'auto', paddingTop: 6, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  cell: { flexBasis: '30%', flexGrow: 1, minWidth: 0 },
  principle: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 28, gap: 12 },
  commRow: { flexDirection: 'row', alignItems: 'center', gap: 80, paddingBottom: 72 },
  commShot: { width: 420, height: 560 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  band: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32, padding: 56, borderRadius: 32 },
  final: { alignItems: 'center', gap: 32, paddingVertical: 120 },
  finalRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  footerLine: { borderTopWidth: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, paddingBottom: 40 },
});
