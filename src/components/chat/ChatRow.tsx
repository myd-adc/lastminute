import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, AvatarStack } from '@/components/ui';
import { getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { soloGroupMembers, type ChatSummary } from '@/lib/selectors';
import { countdown, shortStamp } from '@/lib/time';
import { useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

import { eventShort, groupName } from './chatUtils';

// One row of the chat list (M12 / W06). `compact` = the web list column (46 pt avatar, 15/13 text).
export function ChatRow({
  chat,
  now,
  active,
  compact,
  onPress,
}: {
  chat: ChatSummary;
  now: number;
  active?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const { state } = useStore();
  const { t } = useT();
  const avatar = compact ? 46 : 52;
  const short = eventShort(chat.event);
  const isGroup = chat.kind === 'group';
  const name = isGroup ? groupName(chat.event) : (chat.user?.name ?? '');

  let preview: string;
  if (chat.status === 'waiting') preview = t('chat.row.waiting');
  else if (chat.status === 'contact') preview = t('chat.row.contact', { contact: chat.theirContact ?? '—', event: short });
  else if (chat.status === 'closed') preview = t('chat.row.closed', { event: short });
  else if (!chat.last) preview = isGroup ? t('chat.row.groupEmpty') : t('chat.row.dmEmpty');
  else if (isGroup) {
    const who = chat.last.from === 'me' ? t('chat.row.you') : (getUser(chat.last.from)?.name ?? '');
    preview = t('chat.row.lastFrom', { who, text: chat.last.text });
  } else preview = chat.last.from === 'me' ? t('chat.row.lastFrom', { who: t('chat.row.you'), text: chat.last.text }) : chat.last.text;

  const bold = chat.unread && chat.status === 'open';
  // Waiting and closed chats are dimmed in Figma: faded avatar, muted name and time.
  const dim = chat.status === 'waiting' || chat.status === 'closed';
  const members = isGroup ? soloGroupMembers(state, chat.event.id).slice(0, 3) : [];
  const pillText = [onest('semibold', 12), { color: c.muted }];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${preview}`}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        compact && styles.rowCompact,
        (active || hovered) && { backgroundColor: c.surface },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[{ width: avatar, height: avatar }, styles.center, dim && { opacity: 0.5 }]}>
        {isGroup ? (
          <AvatarStack people={members} size={compact ? 26 : 30} />
        ) : (
          chat.user && <Avatar name={chat.user.name} gradient={chat.user.gradient} size={avatar} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={[onest('bold', compact ? 15 : 16), { color: dim ? c.muted : c.text, flex: 1 }]} numberOfLines={1}>
            {name}
          </Text>
          {chat.last && <Text style={[onest('regular', 12), { color: c.muted }]}>{shortStamp(chat.last.at, now)}</Text>}
        </View>
        <View style={styles.line}>
          <Text
            style={[onest(bold ? 'semibold' : 'regular', compact ? 13 : 14), { color: bold ? c.text : c.muted, flex: 1 }]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {chat.status === 'open' && (
            <View style={[styles.pill, { backgroundColor: c.accentSoft }]}>
              <Text style={[onest('semibold', 12), { color: c.accentInk }]}>{t('chat.row.timer', { time: countdown(chat.expiresAt - now) })}</Text>
            </View>
          )}
          {chat.status === 'waiting' && (
            <View style={[styles.pill, { backgroundColor: c.surface2 }]}>
              <Text style={pillText}>{t('chat.status.waiting')}</Text>
            </View>
          )}
          {chat.status === 'contact' && (
            <View style={[styles.pill, { backgroundColor: c.surface2 }]}>
              <Text style={pillText}>{t('chat.row.contactPill')}</Text>
            </View>
          )}
          {!compact && bold && <View style={[styles.dot, { backgroundColor: c.accent }]} />}
        </View>
      </View>
    </Pressable>
  );
}

// Figma M12: 12 pt padding, 18 pt radius, 12 pt gap; W06 rows use a 16 pt radius.
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  rowCompact: { borderRadius: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3, minWidth: 0 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
