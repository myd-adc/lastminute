import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { MeAvatar } from '@/components/Avatar';
import { EventCard } from '@/components/EventCard';
import { LargeTitle, Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { scenes } from '@/data/mock';
import type { SceneId } from '@/data/types';
import { eventsLabel } from '@/lib/format';
import { useIsWide } from '@/lib/hooks';
import { attendeesFor, fromMySceneCount, myEvents } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

const SIDEBAR = 260;
const MAIN_PADDING = 48;
const GRID_GAP = 20;

export default function EventsScreen() {
  const { state, dispatch } = useAppStore();
  const wide = useIsWide();
  const { width } = useWindowDimensions();
  const list = myEvents(state);

  const cards = list.map((e) => (
    <View key={e.id} style={wide && { width: (width - SIDEBAR - MAIN_PADDING * 2 - GRID_GAP) / 2 }}>
      <EventCard
        event={e}
        attendees={attendeesFor(e.id, state)}
        fromMyScene={fromMySceneCount(e.id, state)}
        going={!!state.going[e.id]}
        wide={wide}
      />
    </View>
  ));

  const empty = (
    <Text style={[type.subhead, { color: colors.label2 }]}>
      {state.search ? 'Нічого не знайшли на твоїх сценах.' : 'На цій сцені поки нічого не заплановано.'}
    </Text>
  );

  if (wide) {
    return (
      <Screen>
        <LargeTitle
          title="Цей тиждень"
          sub={`${eventsLabel(myEvents(state, false).length)} на твоїх сценах. Познач «Я йду» — і побачиш, хто ще йде.`}
        />
        {list.length ? <View style={styles.grid}>{cards}</View> : empty}
      </Screen>
    );
  }

  const options: { key: SceneId | 'all'; label: string }[] = [
    { key: 'all', label: 'Усі' },
    ...scenes.filter((s) => state.myScenes.includes(s.id)).map((s) => ({ key: s.id, label: s.name })),
  ];

  return (
    <Screen>
      <LargeTitle
        title="Події"
        sub="Львів · твої сцени цього тижня"
        right={
          <Pressable accessibilityLabel="Профіль" onPress={() => router.navigate('/profile')}>
            <MeAvatar name={state.me?.name} size={36} />
          </Pressable>
        }
      />
      <SegmentedControl
        options={options}
        value={state.sceneFilter}
        onChange={(filter) => dispatch({ type: 'setSceneFilter', filter })}
      />
      {list.length ? cards : empty}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
});
