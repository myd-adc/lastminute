import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatThread } from '@/components/chat/ChatThread';
import { GroupGate, GroupMembersPanel, MeetCard, membersLabel, useSoloGroup } from '@/components/room/GroupParts';
import { shortTitle, venueShort } from '@/components/room/text';
import { TimerPill } from '@/components/room/TimerPill';
import { AvatarStack, Button, Header, goBack } from '@/components/ui';
import { getEvent } from '@/data/mock';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { expiresAt } from '@/lib/selectors';
import { whenLabel } from '@/lib/time';
import { groupChatId, useNow } from '@/store/AppStore';
import { type, useTheme } from '@/theme';

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

  const head = (
    <View style={[styles.head, wide && styles.headWide, { borderBottomColor: c.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack()}>
        <ChevronLeft size={26} color={c.text} strokeWidth={2} />
      </Pressable>
      {open && <AvatarStack people={g.members.slice(0, 3)} size={wide ? 34 : 28} />}
      <View style={styles.flex}>
        <Text style={[wide ? type.headline : type.bodyStrong, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[type.footnote, { color: c.muted }]} numberOfLines={wide ? 1 : 2}>
          {wide
            ? `${shortTitle(event)} · ${whenLabel(event.startsAt, now, ' ').toLowerCase()} · ${venueShort(event.venue)}`
            : `${membersLabel(g.total)} · ${t('room.group.allSolo')}`}
        </Text>
      </View>
      {open && <TimerPill ms={expiresAt(event) - now} />}
    </View>
  );

  if (!open) {
    return (
      <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: wide ? 0 : insets.top + 8, paddingBottom: 0 }]}>
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
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1 },
  headWide: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 16 },
  mobileTop: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  wideColumn: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center' },
  wideTop: { paddingHorizontal: 28, paddingTop: 16, gap: 14 },
});
