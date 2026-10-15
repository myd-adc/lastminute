import { router } from 'expo-router';
import { useState } from 'react';

import { AboutForm, aboutValid, type AboutDraft } from '@/components/onboarding/AboutForm';
import { OnboardingFrame } from '@/components/onboarding/OnboardingFrame';
import { emptyProfile } from '@/components/onboarding/ProfileForm';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';

// M04b "A little about you" — onboarding step 2 of 3: year of birth and spoken languages.
export default function AboutScreen() {
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [fallbackMe] = useState(emptyProfile);
  const me = state.me ?? fallbackMe;
  const [draft, setDraft] = useState<AboutDraft>(() => ({ birthYear: me.birthYear, languages: me.languages }));
  const valid = aboutValid(draft);

  const next = () => {
    if (!valid) return;
    dispatch({ type: 'setMe', me: { ...me, ...draft } });
    router.push('/interests');
  };

  return (
    <OnboardingFrame
      step={2}
      title={t('onboarding.about.title')}
      subtitle={t('onboarding.about.subtitle')}
      cta={{ label: t('common.next'), onPress: next, disabled: !valid }}
      preview={{ ...me, ...draft, interests: state.interests, solo: state.goesWith === 'solo' }}
    >
      <AboutForm value={draft} onChange={setDraft} />
    </OnboardingFrame>
  );
}
