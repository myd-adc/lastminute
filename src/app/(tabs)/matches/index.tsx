import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ChatPanel } from '@/components/ChatPanel';
import { Icon } from '@/components/Icon';
import { LargeTitle, Screen } from '@/components/Screen';
import { getEvent, getUser } from '@/data/mock';
import { timeLeft } from '@/lib/format';
import { useIsWide, useNow } from '@/lib/hooks';
import { pairKey, useAppStore, type MatchInfo } from '@/store/AppStore';
import { colors, type } from '@/theme';

// Not drawn in Figma: built from the same tokens as the inset-grouped lists.
export default function MatchesScreen() {
  const { state, matches } = useAppStore();
  const wide = useIsWide();
  const now = useNow();
  const [selected, setSelected] = useState<MatchInfo | null>(null);
  const active = selected ?? matches[0] ?? null;

  const open = (m: MatchInfo) =>
    wide
      ? setSelected(m)
      : router.push({ pathname: '/matches/chat/[eventId]/[userId]', params: { eventId: m.eventId, userId: m.userId } });

  const list = (
    <Screen>
      <LargeTitle title="Збіги" sub="Чат відкривається після взаємної згоди і живе 24 години." />
      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="sparkles" size={22} color={colors.label3} />
          <Text style={[type.headline, { textAlign: 'center' }]}>Поки немає збігів</Text>
          <Text style={[type.subhead, { color: colors.label2, textAlign: 'center' }]}>
            Познач «Я йду» на події й натисни «Познайомитись» біля людини, з якою хочеш піти.
          </Text>
        </View>
      ) : (
        <View style={styles.group}>
          {matches.map((m, i) => {
            const user = getUser(m.userId)!;
            const event = getEvent(m.eventId)!;
            const last = state.messages[pairKey(m.eventId, m.userId)]?.at(-1);
            const left = m.expiresAt - now;
            const on = wide && active && pairKey(active.eventId, active.userId) === pairKey(m.eventId, m.userId);
            return (
              <Pressable
                key={pairKey(m.eventId, m.userId)}
                onPress={() => open(m)}
                style={({ pressed }) => [
                  styles.row,
                  i < matches.length - 1 && styles.separator,
                  (pressed || on) && { backgroundColor: colors.fill },
                ]}
              >
                <Avatar name={user.name} color={user.color} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={type.headline}>{user.name}</Text>
                  <Text style={[type.footnote, { color: colors.label2 }]} numberOfLines={1}>
                    {last ? `${last.fromMe ? 'Ти: ' : ''}${last.text}` : event.title}
                  </Text>
                  <Text style={[type.caption, { color: left > 0 ? colors.tint : colors.label3 }]}>
                    {left > 0 ? `${event.title} · ще ${timeLeft(left)}` : `${event.title} · чат закрито`}
                  </Text>
                </View>
                <Icon name="chevron" size={16} color={colors.label3} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );

  if (!wide) return list;
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1 }}>{list}</View>
      {active && (
        <View style={{ width: 380 }}>
          <ChatPanel key={pairKey(active.eventId, active.userId)} eventId={active.eventId} userId={active.userId} variant="rail" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.elevated,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
    alignItems: 'center',
  },
  group: { backgroundColor: colors.elevated, borderRadius: 20, overflow: 'hidden', maxWidth: 720 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  separator: { borderBottomWidth: 1, borderBottomColor: colors.separator },
});
