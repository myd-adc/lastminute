import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { cleanProfile, emptyProfile, isProfileValid, ProfileForm, useUsernameStatus } from '@/components/onboarding/ProfileForm';
import { useT } from '@/i18n';
import { suggestUsername } from '@/lib/username';
import { useStore } from '@/store/AppStore';

// M03 "How should others see you?" — onboarding step 1 of 3.
export default function ProfileSetupScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [draft, setDraft] = useState(() => (state.me ? { ...state.me, username: state.me.username ?? suggestUsername(state.me.name, state.email) } : emptyProfile(state.email)));
  const usernameStatus = useUsernameStatus(draft.username);
  const valid = isProfileValid(draft, usernameStatus);

  const next = () => {
    if (!valid) return;
    dispatch({ type: 'setMe', me: cleanProfile(draft) });
    router.push('/interests');
  };

  return (
    <OnboardingFrame
      step={1}
      title={t('onboarding.profile.title')}
      subtitle={t('onboarding.profile.subtitle')}
      cta={{ label: t('common.next'), onPress: next, disabled: !valid }}
      preview={{ ...draft, interests: state.interests, solo: state.goesWith === 'solo' }}
    >
      <ProfileForm value={draft} onChange={setDraft} usernameStatus={usernameStatus} email={state.email} />
    </OnboardingFrame>
  );
}
