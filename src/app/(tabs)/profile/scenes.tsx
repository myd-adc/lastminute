import { Text } from 'react-native';

import { Group, Row } from '@/components/Group';
import { NavBack, Screen } from '@/components/Screen';
import { scenes } from '@/data/mock';
import { useIsWide } from '@/lib/hooks';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

export default function ScenesScreen() {
  const { state, dispatch } = useAppStore();
  const wide = useIsWide();

  return (
    <Screen contentStyle={wide && { maxWidth: 720 + 96 }}>
      <NavBack label="Профіль" fallback="/profile" />
      <Text style={type.title2}>Мої сцени</Text>
      <Group>
        {scenes.map((s, i) => {
          const on = state.myScenes.includes(s.id);
          return (
            <Row
              key={s.id}
              label={s.name}
              value={on ? '✓' : ''}
              valueColor={colors.tint}
              last={i === scenes.length - 1}
              onPress={() => dispatch({ type: 'toggleScene', sceneId: s.id })}
            />
          );
        })}
      </Group>
      <Text style={[type.footnote, { color: colors.label2 }]}>
        Події показуються лише з твоїх сцен. Ми не відкриваємо ціле місто: щільність працює лише всередині сцени.
      </Text>
    </Screen>
  );
}
