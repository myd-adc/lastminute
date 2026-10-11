import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AccountSection,
  ProfileCard,
  SafetySection,
  StatsCard,
  VisibilitySection,
} from '@/components/profile/ProfileSections';
import { WideProfile } from '@/components/profile/WideProfile';
import { Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { display, useTheme } from '@/theme';

// M16 «Профіль»; on wide web — W09 (two columns inside the WebShell).
// Frame rhythm: 40 pt title row 10 pt under the status bar, then one column with a uniform 12 pt gap.
export default function MeScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const wide = useIsWide();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (wide) return <WideProfile />;

  return (
    <Screen withTabBar contentStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={[display(28, 36), { color: c.text, flex: 1 }]} numberOfLines={1}>
          {t('common.tabs.profile')}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('profile.settingsTitle')} hitSlop={12} onPress={() => router.push('/settings')}>
          <Settings size={22} color={c.text} strokeWidth={2} />
        </Pressable>
      </View>
      <ProfileCard />
      <StatsCard />
      <VisibilitySection />
      <SafetySection />
      <AccountSection confirming={confirmLogout} setConfirming={setConfirmLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', height: 40, marginTop: 2 },
});
