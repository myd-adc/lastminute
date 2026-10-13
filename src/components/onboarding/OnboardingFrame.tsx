import { router } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { display, onest, useTheme } from '@/theme';

import { AuthScreen } from './AuthScreen';
import type { GlowVariant } from './HeroBlobs';
import { Logo, StepBar } from './kit';
import { PreviewCard, type PreviewPerson } from './PreviewCard';

export type Step = 1 | 2;

type Props = {
  step: Step;
  title: string;
  subtitle: string;
  children: ReactNode;
  cta: { label: string; onPress: () => void; disabled?: boolean };
  preview: PreviewPerson; // live card on the wide layout
};

// Back inside the auth stack; on a cold web load there is no history, so fall back to the previous step.
export function backFrom(step: Step) {
  if (router.canGoBack()) router.back();
  else router.replace(step === 2 ? '/profile-setup' : '/login');
}

// M03–M04 chrome on phones (back + 2-segment progress, pinned CTA) and the W02 three-column layout on wide web.
export function OnboardingFrame(props: Props) {
  const wide = useIsWide();
  return wide ? <WideFrame {...props} /> : <MobileFrame {...props} />;
}

// Per-frame vertical rhythm (Figma «Content» stacks): header → title, title → subtitle, subtitle → body, title size.
const RHYTHM: Record<Step, { top: number; sub: number; body: number; title: number; titleLine: number; glow?: GlowVariant }> = {
  1: { top: 28, sub: 12, body: 12, title: 26, titleLine: 30, glow: 'profile' }, // M03
  2: { top: 22, sub: 8, body: 22, title: 28, titleLine: 32, glow: 'interests' }, // M04
};

function MobileFrame({ step, title, subtitle, children, cta }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const r = RHYTHM[step];
  return (
    <AuthScreen glow={r.glow} footer={<Button label={cta.label} onPress={cta.onPress} disabled={cta.disabled} />}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => backFrom(step)}>
          <ChevronLeft size={24} color={c.text} strokeWidth={2} />
        </Pressable>
        <StepBar step={step} />
      </View>
      <Text style={[display(r.title, r.titleLine), { color: c.text, marginTop: r.top }]}>{title}</Text>
      <Text style={[onest('regular', 15, 21), { color: c.muted, marginTop: r.sub }]}>{subtitle}</Text>
      <View style={{ marginTop: r.body }}>{children}</View>
    </AuthScreen>
  );
}

// W02: logo + stepper rail, a 620 pt form column starting at x 360 / y 120, nav buttons 48 pt above the bottom,
// and the 380 pt «Так тебе бачитимуть» preview panel.
function WideFrame({ step, title, subtitle, children, cta, preview }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={[styles.wide, { backgroundColor: c.bg }]}>
      <View style={styles.rail}>
        <Logo />
        <Stepper step={step} />
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wideContent} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <Text style={[onest('medium', 13, 17), { color: c.muted }]}>{t('onboarding.frame.stepOf', { step, total: 2 })}</Text>
            <Text style={[display(36, 40), { letterSpacing: -1.08, color: c.text, marginTop: 12 }]}>{title}</Text>
            <Text style={[onest('regular', 16, 22), { color: c.muted, marginTop: 12, marginBottom: 32 }]}>{subtitle}</Text>
            <View style={{ gap: 16 }}>{children}</View>
          </View>
        </ScrollView>
        <View style={styles.wideFooter}>
          <View style={[styles.column, styles.footerRow]}>
            <Button label={t('onboarding.frame.back')} variant="ghost" onPress={() => backFrom(step)} style={{ width: 140 }} />
            <Button label={cta.label} onPress={cta.onPress} disabled={cta.disabled} style={{ minWidth: 240 }} />
          </View>
        </View>
      </View>

      <View style={[styles.previewPanel, { backgroundColor: c.surface }]}>
        <PreviewCard person={preview} />
      </View>
    </View>
  );
}

function Stepper({ step }: { step: Step }) {
  const { c } = useTheme();
  const { state } = useStore();
  const { t } = useT();
  const me = state.me;
  const items = [
    { label: t('onboarding.frame.steps.profile'), sub: me ? [me.name, me.username && `@${me.username}`].filter(Boolean).join(' · ') : '' },
    {
      label: t('onboarding.frame.steps.interests'),
      sub: state.interests.length ? t('onboarding.frame.picked', { count: state.interests.length }) : '',
    },
  ];
  return (
    <View style={{ gap: 6 }}>
      {items.map((it, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <View key={i} style={[styles.stepRow, current && { backgroundColor: c.surface }]}>
            <View
              style={[
                styles.stepDot,
                { backgroundColor: done || current ? c.accent : c.surface2 },
              ]}
            >
              {done ? (
                <Check size={14} color={c.onAccent} strokeWidth={3} />
              ) : (
                <Text style={[onest('bold', 13), { color: current ? c.onAccent : c.muted }]}>{n}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[onest('semibold', 15, 19), { color: done || current ? c.text : c.muted }]}>{it.label}</Text>
              {done && !!it.sub && (
                <Text style={[onest('regular', 12, 15), { color: c.muted }]} numberOfLines={1}>
                  {it.sub}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24 },
  wide: { flex: 1, flexDirection: 'row' },
  rail: { width: 336, paddingLeft: 48, paddingRight: 48, paddingTop: 40, gap: 78 },
  wideContent: { paddingTop: 120, paddingBottom: 32, paddingLeft: 24, paddingRight: 80 },
  column: { width: '100%', maxWidth: 620 },
  wideFooter: { paddingLeft: 24, paddingRight: 80, paddingTop: 16, paddingBottom: 48 },
  footerRow: { flexDirection: 'row', gap: 12 },
  previewPanel: { width: 380, paddingHorizontal: 40, paddingTop: 140 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
