import { useState } from 'react';

import { EditLayout } from '@/components/onboarding/EditLayout';
import { MIN_INTERESTS, pickableInterests, PreferencesForm, preferencesValid, type PreferencesDraft } from '@/components/onboarding/PreferencesForm';
import { goBack } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

// M16 → «Вподобання»: M04 content prefilled from the store.
export default function PreferencesScreen() {
  const { c } = useTheme();
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [prefs, setPrefs] = useState<PreferencesDraft>(() => ({
    interests: state.interests.filter((id) => pickableInterests().some((i) => i.id === id)),
    vibe: state.vibe,
    goesWith: state.goesWith,
  }));
  const valid = preferencesValid(prefs);

  const save = () => {
    if (!valid) return;
    dispatch({ type: 'setPreferences', ...prefs });
    goBack('/me');
  };

  return (
    <EditLayout
      title={t('onboarding.preferences.title')}
      onSave={save}
      canSave={valid}
      preview={state.me ? { ...state.me, interests: prefs.interests, solo: prefs.goesWith === 'solo' } : undefined}
    >
      <Text style={[onest('semibold', 18), { color: c.text }]}>{t('onboarding.interests.title')}</Text>
      <Text style={[type.subhead, { color: prefs.interests.length < MIN_INTERESTS ? c.danger : c.muted, marginTop: -8 }]}>
        {prefs.interests.length < MIN_INTERESTS
          ? t('onboarding.interests.tooFew', { min: MIN_INTERESTS, count: prefs.interests.length })
          : t('onboarding.interests.picked', { count: prefs.interests.length })}
      </Text>
      <PreferencesForm value={prefs} onChange={setPrefs} />
    </EditLayout>
  );
}
