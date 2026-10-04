import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getEvent, getUser } from '@/data/mock';
import { timeLeft } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { pairKey, useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { NavBack } from './Screen';

type Props = { eventId: string; userId: string; variant: 'phone' | 'rail' };

// "4 · Чат після згоди" (phone) and the web "ChatRail".
export function ChatPanel({ eventId, userId, variant }: Props) {
  const { state, dispatch, matchOf } = useAppStore();
  const [text, setText] = useState('');
  const list = useRef<FlatList>(null);
  const now = useNow();
  const rail = variant === 'rail';

  const user = getUser(userId);
  const event = getEvent(eventId);
  const match = matchOf(eventId, userId);

  if (!user || !event || !match) {
    return (
      <View style={styles.empty}>
        {!rail && <NavBack label="Збіги" fallback="/matches" />}
        <Text style={[type.subhead, styles.muted, { textAlign: 'center', marginTop: 40 }]}>
          Чат відкривається, коли ви обоє хочете познайомитись.
        </Text>
      </View>
    );
  }

  const left = match.expiresAt - now;
  const expired = left <= 0;
  const messages = state.messages[pairKey(eventId, userId)] ?? [];
  const send = () => {
    if (!text.trim() || expired) return;
    dispatch({ type: 'sendMessage', eventId, userId, text: text.trim() });
    setText('');
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <View style={[styles.root, rail && styles.rail]}>
      <View style={[styles.head, rail && { gap: 12, paddingTop: 0, paddingBottom: 0 }]}>
        {!rail && <NavBack label="" fallback="/matches" />}
        <Avatar name={user.name} color={user.color} size={rail ? 40 : 34} fontSize={rail ? 15 : 18} />
        <View style={{ flex: 1 }}>
          <Text style={rail ? type.webH3 : type.headline}>{user.name}</Text>
          <Text style={[rail ? type.webCaption : type.caption, styles.muted]} numberOfLines={1}>
            {rail ? 'збіг на цій події' : `збіг · ${event.title}`}
          </Text>
        </View>
      </View>

      <View style={[styles.timerWrap, rail && { alignItems: 'stretch' }]}>
        <View style={[styles.timer, rail && styles.timerRail]}>
          {!rail && <Icon name="clock" size={16} color={colors.tint} />}
          <Text style={[rail ? type.webCaption : type.footnote, { color: colors.tint }]}>
            {expired ? 'Чат закрито: минуло 24 години після збігу' : `Чат закриється через ${timeLeft(left)}`}
          </Text>
        </View>
      </View>

      <FlatList
        ref={list}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ gap: rail ? 8 : 6 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.row, item.fromMe && { justifyContent: 'flex-end' }]}>
            <View
              style={[
                styles.bubble,
                rail && styles.bubbleRail,
                item.fromMe ? styles.mine : rail ? styles.theirsRail : styles.theirs,
              ]}
            >
              <Text style={[rail ? type.webBody : type.body, { color: item.fromMe ? colors.elevated : colors.label }]}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      {!expired && (
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            submitBehavior="submit"
            placeholder="Повідомлення"
            placeholderTextColor={colors.label3}
            returnKeyType="send"
            style={[rail ? type.webBody : type.body, styles.input, rail && styles.inputRail]}
          />
          <Pressable
            accessibilityLabel="Надіслати"
            onPress={send}
            style={[styles.send, rail && { width: 40, height: 40, borderRadius: 20 }]}
          >
            <Icon name="send" size={rail ? 18 : 20} color={colors.elevated} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 14 },
  rail: {
    gap: 16,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: colors.elevated,
    borderLeftWidth: 1,
    borderLeftColor: colors.separator,
  },
  empty: { flex: 1, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 2, paddingBottom: 6 },
  muted: { color: colors.label2 },
  timerWrap: { alignItems: 'center' },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: colors.tintSoft,
  },
  timerRail: { borderRadius: 16 },
  row: { flexDirection: 'row' },
  bubble: { maxWidth: 272, paddingTop: 9, paddingBottom: 10, paddingHorizontal: 14, borderRadius: 20 },
  bubbleRail: { maxWidth: 250, paddingVertical: 10, borderRadius: 16 },
  mine: { backgroundColor: colors.tint },
  theirs: { backgroundColor: colors.elevated },
  theirsRail: { backgroundColor: colors.fill },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.separator,
    color: colors.label,
  },
  inputRail: { backgroundColor: colors.fill, borderWidth: 0, borderRadius: 20 },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
