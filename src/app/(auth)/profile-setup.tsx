import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { cleanProfile, emptyProfile, isProfileValid, ProfileForm } from '@/components/onboarding/ProfileForm';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M03 «Як тебе показувати іншим?» — onboarding step 1 of 3.
export default function ProfileSetupScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [draft, setDraft] = useState(() => state.me ?? emptyProfile());
  const valid = isProfileValid(draft);

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
      <ProfileForm value={draft} onChange={setDraft} />
    </OnboardingFrame>
  );
}
