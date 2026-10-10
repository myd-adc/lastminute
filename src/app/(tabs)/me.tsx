import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import {
  AccountSection,
  ProfileCard,
  SafetySection,
  StatsCard,
  VisibilitySection,
} from '@/components/profile/ProfileSections';
import { WideProfile } from '@/components/profile/WideProfile';
import { Screen, ScreenTitle } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { useTheme } from '@/theme';

// M16 «Профіль»; on wide web — W09 (two columns inside the WebShell).
export default function MeScreen() {
  const { c } = useTheme();
  const { t } = useT();
  const wide = useIsWide();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (wide) return <WideProfile />;

  return (
    <Screen withTabBar>
      <ScreenTitle
        title={t('common.tabs.profile')}
        right={
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.settingsTitle')} hitSlop={12} onPress={() => router.push('/settings')}>
            <Settings size={24} color={c.text} strokeWidth={2} />
          </Pressable>
        }
      />
      <ProfileCard />
      <StatsCard />
      <VisibilitySection />
      <SafetySection />
      <AccountSection confirming={confirmLogout} setConfirming={setConfirmLogout} />
    </Screen>
  );
}
