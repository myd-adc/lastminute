import { router } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

import { HeroBlobs } from './HeroBlobs';
import { Logo, StepBar } from './kit';
import { PreviewCard, type PreviewPerson } from './PreviewCard';

export type Step = 1 | 2 | 3;

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
  else router.replace(step === 3 ? '/interests' : step === 2 ? '/profile-setup' : '/login');
}

// M03–M05 chrome on phones (back + 3-segment progress, pinned CTA) and the W02 three-column layout on wide web.
export function OnboardingFrame(props: Props) {
  const wide = useIsWide();
  return wide ? <WideFrame {...props} /> : <MobileFrame {...props} />;
}

function MobileFrame({ step, title, subtitle, children, cta }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <Screen keyboard footer={<Button label={cta.label} onPress={cta.onPress} disabled={cta.disabled} />}>
      <HeroBlobs variant="corner" height={320} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => backFrom(step)}>
          <ChevronLeft size={26} color={c.text} strokeWidth={2} />
        </Pressable>
        <StepBar step={step} />
      </View>
      <View style={{ gap: 8, marginTop: 4 }}>
        <Text style={[type.title, { color: c.text }]}>{title}</Text>
        <Text style={[type.body, { color: c.muted }]}>{subtitle}</Text>
      </View>
      {children}
    </Screen>
  );
}

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
            <Text style={[type.footnote, { color: c.muted }]}>{t('onboarding.frame.stepOf', { step, total: 3 })}</Text>
            <Text style={[display(34, 42), { color: c.text, marginTop: 4 }]}>{title}</Text>
            <Text style={[type.body, { color: c.muted, marginTop: 8, marginBottom: 28 }]}>{subtitle}</Text>
            <View style={{ gap: 16 }}>{children}</View>
          </View>
        </ScrollView>
        <View style={styles.wideFooter}>
          <View style={[styles.column, styles.footerRow]}>
            <Button label={t('onboarding.frame.back')} variant="ghost" onPress={() => backFrom(step)} style={{ minWidth: 140 }} />
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
    { label: t('onboarding.frame.steps.profile'), sub: me ? [me.name, me.affiliation].filter(Boolean).join(' · ') : '' },
    {
      label: t('onboarding.frame.steps.interests'),
      sub: state.interests.length ? t('onboarding.frame.picked', { count: state.interests.length }) : '',
    },
    { label: t('onboarding.frame.steps.scene'), sub: '' },
  ];
  return (
    <View style={{ gap: 4 }}>
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
                <Text style={[onest('bold', 12), { color: current ? c.onAccent : c.muted }]}>{n}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[onest('semibold', 14), { color: done || current ? c.text : c.muted }]}>{it.label}</Text>
              {done && !!it.sub && (
                <Text style={[type.caption, { color: c.muted }]} numberOfLines={1}>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 44 },
  wide: { flex: 1, flexDirection: 'row' },
  rail: { width: 260, paddingHorizontal: 40, paddingVertical: 40, gap: 64 },
  wideContent: { paddingTop: 120, paddingBottom: 32, paddingHorizontal: 40 },
  column: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  wideFooter: { paddingHorizontal: 40, paddingTop: 16, paddingBottom: 40 },
  footerRow: { flexDirection: 'row', gap: 12 },
  previewPanel: { width: 380, paddingHorizontal: 36, justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 14 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
