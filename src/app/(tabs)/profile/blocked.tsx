import { Text } from 'react-native';

import { Group, Row } from '@/components/Group';
import { NavBack, Screen } from '@/components/Screen';
import { getUser } from '@/data/mock';
import { useIsWide } from '@/lib/hooks';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

export default function BlockedScreen() {
  const { state, dispatch } = useAppStore();
  const wide = useIsWide();
  const ids = Object.keys(state.blocked);

  return (
    <Screen contentStyle={wide && { maxWidth: 720 + 96 }}>
      <NavBack label="Профіль" fallback="/profile" />
      <Text style={type.title2}>Заблоковані</Text>
      {ids.length === 0 ? (
        <Text style={[type.subhead, { color: colors.label2 }]}>
          Нікого. Заблоковані люди тебе не бачать на подіях, і ти їх теж.
        </Text>
      ) : (
        <Group>
          {ids.map((id, i) => (
            <Row
              key={id}
              label={getUser(id)?.name ?? id}
              value="Розблокувати"
              valueColor={colors.tint}
              last={i === ids.length - 1}
              onPress={() => dispatch({ type: 'unblock', userId: id })}
            />
          ))}
        </Group>
      )}
    </Screen>
  );
}
