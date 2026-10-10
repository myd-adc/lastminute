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
import { goBack, Header, List, ListRow, Screen } from '@/components/ui';
import { getScene } from '@/data/mock';
import { LANGS, useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

// M16b «Налаштування» (+ «Демо» section for testing the live / after-event states).
export default function SettingsScreen() {
  const { c, scheme } = useTheme();
  const { t, lang } = useT();
  const { state, dispatch } = useStore();
  const wide = useIsWide();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const verified = !!state.studentEmail;
  const language = LANGS.find((l) => l.id === lang)?.native;

  return (
    <Screen contentStyle={wide ? styles.wide : undefined}>
      <Header large title={t('profile.settingsTitle')} onBack={() => goBack('/me')} />

      <Section label={t('profile.account.label')}>
        <List>
          <ListRow label={t('profile.settings.phone')} value={maskPhone(state.phone)} />
          <ListRow
            label={t('profile.settings.studentEmail')}
            sub={t('profile.settings.studentEmailSub')}
            right={
              <Text style={[type.subhead, { color: verified ? accentText(c, scheme) : c.muted }]}>
                {verified ? `${getScene('ucu').name} ✓` : t('profile.settings.add')}
              </Text>
            }
            chevron
            onPress={() => router.push('/preferences')}
          />
          <ListRow last label={t('profile.settings.language')} value={language} chevron onPress={() => router.push('/language')} />
        </List>
      </Section>

      <AppearanceSection />
      <NotificationsSection />

      <Section label={t('profile.settings.privacy')}>
        <List>
          <ListRow last label={t('profile.settings.whoSeesCard')} value={t('profile.settings.onlyGoing')} />
        </List>
      </Section>

      <Section label={t('profile.settings.other')}>
        <List>
          <ListRow label={t('profile.safety.rules')} chevron onPress={() => router.push('/rules')} />
          <ListRow last label={t('profile.settings.version')} value="0.1 beta" />
        </List>
      </Section>

      {confirmDelete ? (
        <List>
          <ConfirmRow
            question={t('profile.account.deleteQuestion')}
            confirmLabel={t('profile.account.delete')}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => dispatch({ type: 'logout' })}
          />
        </List>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmDelete(true)}
          style={({ pressed }) => [styles.delete, { backgroundColor: pressed ? c.surface2 : c.surface }]}
        >
          <Text style={[onest('semibold', 16), { color: c.danger }]}>{t('profile.account.deleteAccount')}</Text>
        </Pressable>
      )}

      <View style={{ height: 8 }} />
      <DemoSection />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  delete: { height: 52, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
