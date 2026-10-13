import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatThread } from '@/components/chat/ChatThread';
import { GroupGate, GroupMembersPanel, MeetCard, membersLabel, useSoloGroup } from '@/components/room/GroupParts';
import { Faces } from '@/components/room/Face';
import { shortTitle, venueShort } from '@/components/room/text';
import { TimerPill } from '@/components/room/TimerPill';
import { Button, Header, goBack } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { expiresAt } from '@/lib/selectors';
import { whenLabel } from '@/lib/time';
import { groupChatId, useNow } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = id ? getEvent(id) : undefined;
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  if (!event) {
    return (
      <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top + 8, paddingHorizontal: 20, gap: 16 }]}>
        <Header title={t('room.group.fallbackTitle')} />
        <Text style={[type.body, { color: c.muted }]}>{t('room.eventGone')}</Text>
        <Button label={t('room.toEvents')} variant="secondary" onPress={() => router.replace('/')} />
      </View>
    );
  }
  return <Group event={event} />;
}

function Group({ event }: { event: Event }) {
  const { c } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const wide = useIsWide();
  const now = useNow();
  const g = useSoloGroup(event);
  const title = t('room.group.title', { event: shortTitle(event) });
  const open = g.hasAccess && !!g.group;

  // M08b: 58 pt header under the status bar (row 46 + 12 bottom padding), hairline below.
  // W05b: no back chevron (the sidebar navigates), 36 pt faces, 18 pt title.
  const head = (
    <View style={[styles.head, wide ? styles.headWide : styles.headMobile, { borderBottomColor: c.line }]}>
      {(!wide || !open) && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack()}>
          <ChevronLeft size={26} color={c.text} strokeWidth={2} />
        </Pressable>
      )}
      {open && <Faces people={g.members.slice(0, 3)} size={wide ? 36 : 28} fontSize={wide ? 14 : 11} />}
      <View style={[styles.flex, { gap: wide ? 2 : 1 }]}>
        <Text style={[onest('bold', wide ? 18 : 15, wide ? 23 : 19), { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[onest('regular', wide ? 13 : 12, wide ? 17 : 15), { color: c.muted }]} numberOfLines={wide ? 1 : 2}>
          {wide
            ? `${shortTitle(event)} · ${whenLabel(event.startsAt, now, ' ').toLowerCase()} · ${venueShort(event.venue)}`
            : `${membersLabel(g.total)} · ${t('room.group.allSolo')}`}
        </Text>
      </View>
      {open && <TimerPill size="sm" ms={expiresAt(event) - now} />}
    </View>
  );

  if (!open) {
    return (
      <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: wide ? 0 : insets.top, paddingBottom: 0 }]}>
        {head}
        <GroupGate event={event} g={g} />
      </View>
    );
  }

  const thread = <ChatThread chatId={groupChatId(event.id)} eventId={event.id} variant="screen" />;

  // W05b: thread column with the meeting point on top, members panel on the right.
  if (wide) {
    return (
      <View style={[styles.flex, styles.row, { backgroundColor: c.bg }]}>
        <View style={styles.flex}>
          {head}
          <View style={styles.wideColumn}>
            <View style={styles.wideTop}>
              <MeetCard g={g} showMenu={false} />
            </View>
            <View style={styles.flex}>{thread}</View>
          </View>
        </View>
        <GroupMembersPanel event={event} g={g} />
      </View>
    );
  }

  // M08b
  return (
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {head}
      <View style={styles.mobileTop}>
        <MeetCard g={g} />
      </View>
      <View style={styles.flex}>{thread}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  head: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  headMobile: { gap: 10, minHeight: 58, paddingHorizontal: 20, paddingBottom: 12 },
  headWide: { gap: 14, paddingLeft: 28, paddingRight: 24, paddingTop: 22, paddingBottom: 16 },
  // Meeting point 12 below the header; the thread's own 12 pt top padding + 15 = Figma's 27 pt gap to the messages.
  mobileTop: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 15 },
  wideColumn: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center' },
  wideTop: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 4 },
});
