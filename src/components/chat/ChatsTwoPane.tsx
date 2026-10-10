import { router } from 'expo-router';
import { MessageSquare, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Segmented } from '@/components/ui';
import { useT } from '@/i18n';
import { chatList, isPast, type ChatSummary } from '@/lib/selectors';
import { dayLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type, type Palette, useStyles, useTheme } from '@/theme';

import { ChatConversation } from './ChatConversation';
import { ChatRow } from './ChatRow';
import { chatSections, eventShort, matchesQuery } from './chatUtils';

export const CHAT_LIST_WIDTH = 290;

// W06: chat list column + selected conversation, used by /chats and /chat/[eventId]/[userId] on wide web.
export function ChatsTwoPane({ initialChatId }: { initialChatId?: string }) {
  const { c } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const { state } = useStore();
  const now = useNow();
  const all = useMemo(() => chatList(state, now), [state, now]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(initialChatId);
  const initialTab = all.find((ch) => ch.id === initialChatId && isPast(ch.event, now)) ? 'archive' : 'active';
  const [tab, setTab] = useState<'active' | 'archive'>(initialTab);

  const active = all.filter((ch) => !isPast(ch.event, now));
  const archive = all.filter((ch) => isPast(ch.event, now));
  const visible = (tab === 'active' ? active : archive).filter((ch) => matchesQuery(ch, query));
  const { upcoming, past } = chatSections(visible, now);

  const dms = all.filter((ch) => ch.kind === 'dm');
  const selected = dms.find((ch) => ch.id === selectedId) ?? active.find((ch) => ch.kind === 'dm') ?? dms[0];

  const open = (chat: ChatSummary) => {
    if (chat.kind === 'group') router.push({ pathname: '/event/[id]/group', params: { id: chat.event.id } });
    else setSelectedId(chat.id);
  };

  const rows = (list: ChatSummary[]) =>
    list.map((chat) => (
      <ChatRow key={chat.id} chat={chat} now={now} compact active={chat.id === selected?.id} onPress={() => open(chat)} />
    ));

  return (
    <View style={s.root}>
      <View style={s.list}>
        <Text style={[type.title, { fontSize: 26, lineHeight: 32, color: c.text }]}>{t('chat.title')}</Text>
        <View style={s.search}>
          <Search size={16} color={c.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('chat.searchPlaceholder')}
            placeholderTextColor={c.muted}
            style={s.searchInput}
          />
        </View>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'active', label: t('chat.tabActive', { count: active.length }) },
            { key: 'archive', label: t('chat.tabArchive', { count: archive.length }) },
          ]}
          style={{ height: 40 }}
        />
        <ScrollView style={s.flex} contentContainerStyle={{ gap: 2, paddingBottom: 24 }}>
          {upcoming.map((g) => (
            <View key={g.event.id} style={{ gap: 2 }}>
              <Text style={s.section}>
                {`${dayLabel(g.event.startsAt, now)} · ${eventShort(g.event)}`.toUpperCase()}
              </Text>
              {rows(g.chats)}
            </View>
          ))}
          {past.length > 0 && (
            <View style={{ gap: 2 }}>
              <Text style={s.section}>{t('chat.pastEvents').toUpperCase()}</Text>
              {rows(past)}
            </View>
          )}
          {visible.length === 0 && (
            <Text style={[onest('regular', 13, 18), { color: c.muted, paddingTop: 12 }]}>
              {query ? t('chat.notFound') : tab === 'active' ? t('chat.noActive') : t('chat.archiveEmpty')}
            </Text>
          )}
        </ScrollView>
      </View>
      <View style={s.flex}>
        {selected?.user ? (
          <ChatConversation key={selected.id} eventId={selected.event.id} userId={selected.user.id} variant="panel" />
        ) : (
          <View style={[s.flex, s.empty]}>
            <MessageSquare size={36} color={c.muted} />
            <Text style={[onest('bold', 17), { color: c.text }]}>{t('chat.paneEmptyTitle')}</Text>
            <Text style={[onest('regular', 14, 20), { color: c.muted, textAlign: 'center', maxWidth: 360 }]}>
              {t('chat.paneEmptyText')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: c.bg },
    flex: { flex: 1 },
    list: { width: CHAT_LIST_WIDTH, borderRightWidth: 1, borderRightColor: c.line, paddingTop: 28, paddingHorizontal: 14, gap: 12 },
    search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, borderRadius: 12, backgroundColor: c.surface, paddingHorizontal: 12 },
    searchInput: { flex: 1, height: 40, color: c.text, ...onest('regular', 14) },
    section: { ...onest('semibold', 11, 14), letterSpacing: 0.4, color: c.muted, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4 },
    empty: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  });
