import { useState } from 'react';
import { Text } from 'react-native';

import { EditLayout } from '@/components/onboarding/EditLayout';
import { MIN_INTERESTS, pickableInterests, PreferencesForm, preferencesValid, type PreferencesDraft } from '@/components/onboarding/PreferencesForm';
import { SceneForm, sceneValid, type SceneDraft } from '@/components/onboarding/SceneForm';
import { goBack } from '@/components/ui';
import { scenes } from '@/data/mock';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

// M16 → «Вподобання і сцени»: M04 + M05 content prefilled from the store.
export default function PreferencesScreen() {
  const { c } = useTheme();
  const { state, dispatch } = useStore();
  const { t } = useT();
  const [prefs, setPrefs] = useState<PreferencesDraft>(() => ({
    interests: state.interests.filter((id) => pickableInterests().some((i) => i.id === id)),
    vibe: state.vibe,
    goesWith: state.goesWith,
  }));
  const [scene, setScene] = useState<SceneDraft>({ sceneId: state.sceneId, studentEmail: state.studentEmail });
  const valid = preferencesValid(prefs) && sceneValid(scene);

  const save = () => {
    if (!valid || !scene.sceneId) return;
    dispatch({ type: 'setPreferences', ...prefs });
    dispatch({ type: 'setScene', sceneId: scene.sceneId, studentEmail: scene.studentEmail });
    goBack('/me');
  };

  return (
    <EditLayout
      title={t('onboarding.preferences.title')}
      onSave={save}
      canSave={valid}
      preview={
        state.me
          ? {
              ...state.me,
              interests: prefs.interests,
              solo: prefs.goesWith === 'solo',
              sceneName: scenes.find((s) => s.id === scene.sceneId)?.name,
            }
          : undefined
      }
    >
      <Text style={[onest('semibold', 18), { color: c.text }]}>{t('onboarding.interests.title')}</Text>
      <Text style={[type.subhead, { color: prefs.interests.length < MIN_INTERESTS ? c.danger : c.muted, marginTop: -8 }]}>
        {prefs.interests.length < MIN_INTERESTS
          ? t('onboarding.interests.tooFew', { min: MIN_INTERESTS, count: prefs.interests.length })
          : t('onboarding.interests.picked', { count: prefs.interests.length })}
      </Text>
      <PreferencesForm value={prefs} onChange={setPrefs} />
      <Text style={[onest('semibold', 18), { color: c.text, marginTop: 16 }]}>{t('onboarding.scene.title')}</Text>
      <Text style={[type.subhead, { color: c.muted, marginTop: -8 }]}>{t('onboarding.scene.subtitle')}</Text>
      <SceneForm value={scene} onChange={setScene} />
    </EditLayout>
  );
}
