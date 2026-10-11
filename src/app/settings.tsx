import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { accentText, maskPhone } from '@/components/profile/names';
import {
  AppearanceSection,
  ConfirmRow,
  DemoSection,
  NotificationsSection,
  Section,
} from '@/components/profile/ProfileSections';
import { BackTitle } from '@/components/profile/BackTitle';
import { Group, Row } from '@/components/profile/Rows';
import { goBack, Screen } from '@/components/ui';
import { isLive } from '@/api/client';
import { getScene } from '@/data/mock';
import { LANGS, useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

// M16b «Налаштування» (+ «Демо» section for testing the live / after-event states).
// Frame rhythm: 40 pt header 6 pt under the status bar, 12 pt to the first caption, then a uniform 7 pt gap.
export default function SettingsScreen() {
  const { c, scheme } = useTheme();
  const { t, lang } = useT();
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const verified = !!state.studentEmail;
  const language = LANGS.find((l) => l.id === lang)?.native;

  return (
    <Screen contentStyle={[styles.content, wide && styles.wide]}>
      <BackTitle title={t('profile.settingsTitle')} onBack={() => goBack('/me')} style={styles.header} />

      <Section label={t('profile.account.label')}>
        <Group dense>
          <Row label={t('profile.settings.phone')} value={maskPhone(state.phone)} chevron />
          <Row
            label={t('profile.settings.studentEmail')}
            sub={t('profile.settings.studentEmailSub')}
            value={verified ? `${getScene('ucu').name} ✓` : t('profile.settings.add')}
            valueColor={verified ? accentText(c, scheme) : undefined}
            chevron
            onPress={() => router.push('/preferences')}
          />
          <Row last label={t('profile.settings.language')} value={language} chevron onPress={() => router.push('/language')} />
        </Group>
      </Section>

      <AppearanceSection />
      <NotificationsSection dense />

      <Section label={t('profile.settings.privacy')}>
        <Group dense>
          <Row last label={t('profile.settings.whoSeesCard')} value={t('profile.settings.onlyGoing')} chevron />
        </Group>
      </Section>

      <Section label={t('profile.settings.other')}>
        <Group dense>
          <Row label={t('profile.safety.rules')} chevron onPress={() => router.push('/rules')} />
          <Row last label={t('profile.settings.version')} value="0.1 beta" />
        </Group>
      </Section>

      {confirmDelete ? (
        <Group>
          <ConfirmRow
            question={t('profile.account.deleteQuestion')}
            confirmLabel={t('profile.account.delete')}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => dispatch({ type: 'logout' })}
          />
        </Group>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmDelete(true)}
          style={({ pressed }) => [styles.delete, { backgroundColor: pressed ? c.surface2 : c.surface }]}
        >
          <Text style={[onest('semibold', 15, 19), { color: c.danger }]}>{t('profile.account.deleteAccount')}</Text>
        </Pressable>
      )}

      {/* The live backend runs on server time, so the demo clock would only desync the UI. */}
      {!isLive && (
        <>
          <View style={styles.demoGap} />
          <DemoSection dense />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 7 },
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { marginTop: -2, marginBottom: 5 },
  delete: { paddingVertical: 12, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  demoGap: { height: 9 },
});
