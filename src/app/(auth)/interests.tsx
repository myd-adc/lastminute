import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { pickableInterests, PreferencesForm, preferencesValid, type PreferencesDraft } from '@/components/onboarding/PreferencesForm';
import { emptyProfile } from '@/components/onboarding/ProfileForm';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M04 «Що тебе витягує з дому?» — onboarding step 2 of 3.
export default function InterestsScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [draft, setDraft] = useState<PreferencesDraft>(() => ({
    interests: state.interests.filter((id) => pickableInterests().some((i) => i.id === id)),
    vibe: state.vibe,
    goesWith: state.goesWith,
  }));
  const [fallbackMe] = useState(emptyProfile);
  const valid = preferencesValid(draft);

  const next = () => {
    if (!valid) return;
    dispatch({ type: 'setPreferences', ...draft });
    router.push('/scene-select');
  };

  return (
    <OnboardingFrame
      step={2}
      title={t('onboarding.interests.title')}
      subtitle={t('onboarding.interests.subtitle')}
      cta={{ label: t('onboarding.interests.next', { count: draft.interests.length }), onPress: next, disabled: !valid }}
      preview={{ ...(state.me ?? fallbackMe), interests: draft.interests, solo: draft.goesWith === 'solo' }}
    >
      <PreferencesForm value={draft} onChange={setDraft} />
    </OnboardingFrame>
  );
}
