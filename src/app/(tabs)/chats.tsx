import { router } from 'expo-router';
import { Clock, MessageSquare, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChatRow } from '@/components/chat/ChatRow';
import { ChatsTwoPane } from '@/components/chat/ChatsTwoPane';
import { chatSections, eventShort, matchesQuery } from '@/components/chat/chatUtils';
import { Button, Screen, ScreenTitle } from '@/components/ui';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { chatList, type ChatSummary } from '@/lib/selectors';
import { dayLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type Palette, useStyles, useTheme } from '@/theme';

export default function ChatsScreen() {
  const wide = useIsWide();
  return wide ? <ChatsTwoPane /> : <ChatsList />;
}

// M12 chats: today's chats grouped by event, then past events.
function ChatsList() {
  const { c } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const { state } = useStore();
  const now = useNow();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const all = useMemo(() => chatList(state, now), [state, now]);
  const visible = all.filter((ch) => matchesQuery(ch, query));
  const { upcoming, past } = chatSections(visible, now);

  const open = (chat: ChatSummary) => {
    if (chat.kind === 'group') router.push({ pathname: '/event/[id]/group', params: { id: chat.event.id } });
    else router.push({ pathname: '/chat/[eventId]/[userId]', params: { eventId: chat.event.id, userId: chat.user!.id } });
  };

  const rows = (list: ChatSummary[]) =>
    list.map((chat) => <ChatRow key={chat.id} chat={chat} now={now} active={chat.status === 'open'} onPress={() => open(chat)} />);

  return (
    <Screen withTabBar contentStyle={{ gap: 12 }}>
      <ScreenTitle
        title={t('chat.title')}
        right={
          all.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={searching ? t('chat.closeSearch') : t('chat.search')}
              hitSlop={12}
              onPress={() => {
                setSearching((v) => !v);
                setQuery('');
              }}
            >
              {searching ? <X size={24} color={c.text} /> : <Search size={24} color={c.text} />}
            </Pressable>
          )
        }
      />

      {searching && (
        <View style={s.search}>
          <Search size={18} color={c.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder={t('chat.searchPlaceholder')}
            placeholderTextColor={c.muted}
            style={s.searchInput}
          />
        </View>
      )}

      {all.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <MessageSquare size={30} color={c.muted} />
          </View>
          <Text style={[onest('bold', 18), { color: c.text }]}>{t('chat.emptyTitle')}</Text>
          <Text style={[onest('regular', 15, 21), { color: c.muted, textAlign: 'center' }]}>
            {t('chat.emptyText')}
          </Text>
          <Button label={t('chat.toEvents')} onPress={() => router.navigate('/')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </View>
      ) : (
        <>
          {upcoming.map((g) => (
            <View key={g.event.id} style={s.section}>
              <Text style={s.label} numberOfLines={1}>
                {dayLabel(g.event.startsAt, now)} · {eventShort(g.event)} · {g.event.venue}
              </Text>
              {rows(g.chats)}
            </View>
          ))}
          {past.length > 0 && (
            <View style={s.section}>
              <Text style={s.label}>{t('chat.pastEvents')}</Text>
              {rows(past)}
            </View>
          )}
          {visible.length === 0 && (
            <Text style={[onest('regular', 15), { color: c.muted }]}>{t('chat.notFoundQuery', { query })}</Text>
          )}
          <View style={s.note}>
            <Clock size={20} color={c.muted} />
            <Text style={[onest('regular', 13, 18), { color: c.muted, flex: 1 }]}>
              {t('chat.lifetimeNote')}
            </Text>
          </View>
        </>
      )}
    </Screen>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 24, backgroundColor: c.surface, paddingHorizontal: 16 },
    searchInput: { flex: 1, height: 48, color: c.text, ...onest('regular', 15) },
    section: { gap: 4, marginHorizontal: -8 },
    label: { ...onest('medium', 14, 19), color: c.muted, paddingHorizontal: 8, paddingBottom: 4 },
    note: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.line,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginTop: 4,
    },
    empty: { alignItems: 'center', gap: 10, paddingTop: 60, paddingHorizontal: 12 },
    emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  });
