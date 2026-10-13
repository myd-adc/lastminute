import { router } from 'expo-router';
import { MessageSquare, Search } from 'lucide-react-native';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';
import { chatList, isPast, type ChatSummary } from '@/lib/selectors';
import { dayLabel } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { display, onest, type Palette, useStyles, useTheme } from '@/theme';

import { ChatConversation } from './ChatConversation';
import { ChatRow } from './ChatRow';
import { chatSections, eventShort, matchesQuery } from './chatUtils';

export const CHAT_LIST_WIDTH = 380;

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
        <Text style={[display(26, 32), { color: c.text }]}>{t('chat.title')}</Text>
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
        {/* W06 tabs: a 40 pt track (12 pt radius, 9 pt segments, 13 pt labels) — smaller than the shared Segmented. */}
        <View style={s.tabs} accessibilityRole="tablist">
          {(['active', 'archive'] as const).map((key) => {
            const on = tab === key;
            const count = key === 'active' ? active.length : archive.length;
            return (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(key)}
                style={[s.tab, on && { backgroundColor: c.surface2 }]}
              >
                <Text style={[onest('semibold', 13), { color: on ? c.text : c.muted }]} numberOfLines={1}>
                  {key === 'active' ? t('chat.tabActive', { count }) : t('chat.tabArchive', { count })}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ScrollView style={s.flex} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
          {upcoming.map((g) => (
            <Fragment key={g.event.id}>
              <Text style={s.section}>
                {`${dayLabel(g.event.startsAt, now)} · ${eventShort(g.event)}`.toUpperCase()}
              </Text>
              {rows(g.chats)}
            </Fragment>
          ))}
          {past.length > 0 && (
            <>
              <Text style={s.section}>{t('chat.pastEvents').toUpperCase()}</Text>
              {rows(past)}
            </>
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
    // Figma W06 «Chat list»: 380 pt column, 28 pt top, 20 pt sides, 8 pt gap.
    list: { width: CHAT_LIST_WIDTH, borderRightWidth: 1, borderRightColor: c.line, paddingTop: 28, paddingHorizontal: 20, gap: 8 },
    search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, borderRadius: 12, backgroundColor: c.surface, paddingLeft: 14, paddingRight: 12 },
    searchInput: { flex: 1, height: 42, color: c.text, ...onest('regular', 14) },
    tabs: { flexDirection: 'row', height: 40, padding: 4, gap: 4, borderRadius: 12, backgroundColor: c.surface },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
    section: { ...onest('semibold', 12, 15), color: c.muted },
    empty: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  });
