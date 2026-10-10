import { router } from 'expo-router';
import { Ban, Check, ChevronLeft, Clock, Flag, MoreHorizontal, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, goBack } from '@/components/ui';
import { getEvent, getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { chatState, expiresAt } from '@/lib/selectors';
import { countdown, time } from '@/lib/time';
import { dmChatId, useNow, useStore } from '@/store/AppStore';
import { onest, type Palette, useStyles, useTheme } from '@/theme';

import { ChatThread } from './ChatThread';
import { accentInk, dayInline, eventShort } from './chatUtils';

// DM conversation: header (avatar, name, event line, timer pill, ⋯ menu) + ChatThread.
// 'screen' = M13 phone screen, 'panel' = right pane of the W06 two-pane layout.
export function ChatConversation({ eventId, userId, variant }: { eventId: string; userId: string; variant: 'screen' | 'panel' }) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useStore();
  const now = useNow();
  const [menuOpen, setMenuOpen] = useState(false);

  const event = getEvent(eventId);
  const user = getUser(userId);
  const chatId = dmChatId(eventId, userId);

  if (!event || !user || state.blocked[userId]) {
    return (
      <View style={[s.flex, s.empty, variant === 'screen' && { paddingTop: insets.top + 40 }]}>
        <Text style={[onest('bold', 17), { color: c.text }]}>{t('chat.unavailableTitle')}</Text>
        <Text style={[onest('regular', 14), { color: c.muted, textAlign: 'center' }]}>
          {t('chat.unavailableText')}
        </Text>
        <Pressable onPress={() => router.replace('/chats')} style={[s.emptyBtn, { backgroundColor: c.surface2 }]}>
          <Text style={[onest('bold', 15), { color: c.text }]}>{t('chat.toChats')}</Text>
        </Pressable>
      </View>
    );
  }

  const status = chatState(state, event, userId, now);
  const ink = accentInk(c, scheme);
  const day = dayInline(event.startsAt, now);
  const sub =
    variant === 'panel'
      ? `${eventShort(event)} · ${day} ${time(event.startsAt)} · ${event.venue}`
      : `${eventShort(event)} · ${day} ${time(event.startsAt)}`;

  const statusPill =
    status === 'open' ? (
      <View style={[s.pill, { backgroundColor: c.accentSoft, borderColor: c.accent, borderWidth: 1.5 }]}>
        <Clock size={14} color={ink} strokeWidth={2.2} />
        <Text style={[onest('semibold', 13), { color: ink }]}>{countdown(expiresAt(event) - now)}</Text>
      </View>
    ) : (
      <View style={[s.pill, { backgroundColor: c.surface2 }]}>
        <Text style={[onest('semibold', 13), { color: c.text }]}>
          {status === 'waiting' ? t('chat.status.waiting') : status === 'contact' ? t('chat.status.contact') : t('chat.status.closed')}
        </Text>
        {status === 'contact' && <Check size={13} color={c.text} strokeWidth={2.4} />}
      </View>
    );

  const headerTop = variant === 'screen' ? insets.top + 4 : 0;

  return (
    <View style={s.flex}>
      <View style={[s.header, variant === 'panel' ? s.headerPanel : { paddingTop: headerTop + 6 }]}>
        {variant === 'screen' && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack('/chats')}>
            <ChevronLeft size={26} color={c.text} strokeWidth={2} />
          </Pressable>
        )}
        <Avatar name={user.name} gradient={user.gradient} size={40} />
        <View style={[s.flex, { minWidth: 0 }]}>
          <Text style={[onest('bold', 16), { color: c.text }]} numberOfLines={1}>
            {variant === 'panel' ? `${user.name}, ${user.age}` : user.name}
          </Text>
          <Text style={[onest('regular', 13), { color: c.muted }]} numberOfLines={1}>
            {sub}
          </Text>
        </View>
        {statusPill}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.menu.open')}
          onPress={() => setMenuOpen((v) => !v)}
          style={({ pressed }) => [s.more, pressed && { opacity: 0.8 }]}
        >
          <MoreHorizontal size={20} color={c.text} strokeWidth={2} />
        </Pressable>
      </View>

      <ChatThread chatId={chatId} eventId={eventId} userId={userId} variant={variant} />

      {menuOpen && (
        <>
          <Pressable accessibilityLabel={t('chat.menu.close')} style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <View style={[s.menu, { top: headerTop + (variant === 'panel' ? 64 : 56) }]}>
            {status === 'open' && (
              <MenuItem
                icon={<X size={18} color={c.text} strokeWidth={2} />}
                label={t('chat.menu.closeChat')}
                color={c.text}
                onPress={() => {
                  setMenuOpen(false);
                  dispatch({ type: 'closeChat', chatId });
                }}
              />
            )}
            <MenuItem
              icon={<Flag size={18} color={c.text} strokeWidth={2} />}
              label={t('common.report')}
              color={c.text}
              onPress={() => {
                setMenuOpen(false);
                router.push({ pathname: '/report/[userId]', params: { userId, eventId } });
              }}
            />
            <MenuItem
              icon={<Ban size={18} color={c.danger} strokeWidth={2} />}
              label={t('common.block')}
              color={c.danger}
              onPress={() => {
                setMenuOpen(false);
                dispatch({ type: 'block', userId });
                router.replace('/chats');
              }}
            />
          </View>
        </>
      )}
    </View>
  );
}

function MenuItem({ icon, label, color, onPress }: { icon: ReactNode; label: string; color: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="menuitem"
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.item,
        (pressed || hovered) && { backgroundColor: c.surface },
      ]}
    >
      {icon}
      <Text style={[onest('medium', 15), { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, paddingHorizontal: 12, borderRadius: 10 },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    empty: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
    emptyBtn: { marginTop: 8, height: 48, borderRadius: 24, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
      backgroundColor: c.bg,
    },
    headerPanel: { height: 72, paddingHorizontal: 24, paddingBottom: 0 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
    more: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    menu: {
      position: 'absolute',
      right: 16,
      width: 240,
      padding: 6,
      borderRadius: 16,
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.line,
      boxShadow: '0px 12px 32px rgba(0,0,0,0.35)',
      gap: 2,
    },
  });
