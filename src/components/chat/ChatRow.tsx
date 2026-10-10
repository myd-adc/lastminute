import { Check, Hourglass } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, AvatarStack } from '@/components/ui';
import { getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { soloGroupMembers, type ChatSummary } from '@/lib/selectors';
import { countdown, shortStamp } from '@/lib/time';
import { useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

import { accentInk, eventShort, groupName } from './chatUtils';

// One row of the chat list (M12 / W06). `compact` = the narrower web list column.
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
  const { c, scheme } = useTheme();
  const { state } = useStore();
  const { t } = useT();
  const ink = accentInk(c, scheme);
  const avatar = compact ? 44 : 56;
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
  const members = isGroup ? soloGroupMembers(state, chat.event.id).slice(0, 3) : [];

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
        chat.status === 'closed' && { opacity: 0.5 },
      ]}
    >
      <View style={[{ width: avatar, height: avatar }, styles.center, chat.status === 'waiting' && { opacity: 0.7 }]}>
        {isGroup ? (
          <AvatarStack people={members} size={compact ? 24 : 30} />
        ) : (
          chat.user && <Avatar name={chat.user.name} gradient={chat.user.gradient} size={avatar} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.line}>
          <Text
            style={[onest('bold', compact ? 15 : 17), { color: c.text, flex: 1 }, chat.status === 'waiting' && { opacity: 0.75 }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {chat.last && <Text style={[onest('regular', compact ? 12 : 13), { color: c.muted }]}>{shortStamp(chat.last.at, now)}</Text>}
        </View>
        <View style={styles.line}>
          <Text
            style={[bold ? onest('semibold', compact ? 13 : 15) : onest('regular', compact ? 13 : 15), { color: bold ? c.text : c.muted, flex: 1 }]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {chat.status === 'open' && (
            <View style={[styles.pill, { backgroundColor: c.accentSoft }]}>
              <Hourglass size={12} color={ink} strokeWidth={2.2} />
              <Text style={[onest('semibold', compact ? 12 : 13), { color: ink }]}>{countdown(chat.expiresAt - now)}</Text>
            </View>
          )}
          {chat.status === 'waiting' && (
            <View style={[styles.pill, { backgroundColor: c.surface2 }]}>
              <Text style={[onest('semibold', compact ? 12 : 13), { color: c.text }]}>{t('chat.status.waiting')}</Text>
            </View>
          )}
          {chat.status === 'contact' && (
            <View style={[styles.pill, { backgroundColor: c.surface2 }]}>
              <Text style={[onest('semibold', compact ? 12 : 13), { color: c.text }]}>{t('chat.status.contact')}</Text>
              <Check size={13} color={c.text} strokeWidth={2.4} />
            </View>
          )}
          {chat.status === 'open' && chat.unread && <View style={[styles.dot, { backgroundColor: c.accent }]} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 20 },
  rowCompact: { gap: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4, minWidth: 0 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
