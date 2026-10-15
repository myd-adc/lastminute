import { router } from 'expo-router';
import { Ban, ChevronLeft, Clock, Flag, MoreHorizontal, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, goBack } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent, getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { chatState, expiresAt, nameAge } from '@/lib/selectors';
import { countdown, time } from '@/lib/time';
import { dmChatId, useNow, useStore } from '@/store/AppStore';
import { onest, type Palette, useStyles, useTheme } from '@/theme';

import { ChatThread } from './ChatThread';
import { dayInline, eventShort } from './chatUtils';

// DM conversation: header (avatar, name, event line, timer pill, ⋯ menu) + ChatThread.
// 'screen' = M13 phone screen, 'panel' = right pane of the W06 two-pane layout.
export function ChatConversation({ eventId, userId, variant }: { eventId: string; userId: string; variant: 'screen' | 'panel' }) {
  const { c } = useTheme();
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
  const ink = c.accentInk;
  const panel = variant === 'panel';
  const day = dayInline(event.startsAt, now);
  const sub =
    variant === 'panel'
      ? `${eventShort(event)} · ${day} ${time(event.startsAt)} · ${event.venue}`
      : `${eventShort(event)} · ${day} ${time(event.startsAt)}`;

  const statusPill =
    status === 'open' ? (
      <View style={[s.pill, { borderColor: c.accent }]}>
        <Clock size={14} color={ink} strokeWidth={2} />
        <Text style={[onest('semibold', 13), { color: ink }]}>{countdown(expiresAt(event) - now)}</Text>
      </View>
    ) : (
      <View style={[s.pill, { backgroundColor: c.surface2, borderColor: c.surface2 }]}>
        <Text style={[onest('semibold', 13), { color: c.muted }]}>
          {status === 'waiting' ? t('chat.status.waiting') : status === 'contact' ? t('chat.row.contactPill') : t('chat.status.closed')}
        </Text>
      </View>
    );

  // M13: the 60 pt header starts right under the status bar (48 pt row + 12 pt bottom padding).
  const headerTop = variant === 'screen' ? insets.top : 0;

  return (
    <View style={s.flex}>
      <View style={[s.headerBlock, panel ? s.headerBlockPanel : { paddingTop: headerTop + 4 }]}>
        <View style={[s.headerRow, panel && s.headerRowPanel]}>
          {variant === 'screen' && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} onPress={() => goBack('/chats')}>
              <ChevronLeft size={26} color={c.text} strokeWidth={2} />
            </Pressable>
          )}
          <Avatar name={user.name} gradient={user.gradient} photoUri={user.photoUri} size={panel ? 44 : 40} ring={!panel} />
          <View style={[s.flex, { minWidth: 0, gap: panel ? 2 : 1 }]}>
            <Text style={[onest('bold', panel ? 17 : 16), { color: c.text }]} numberOfLines={1}>
              {panel ? nameAge(user) : user.name}
            </Text>
            {panel && (
              <Text style={[onest('regular', 13), { color: c.muted }]} numberOfLines={1}>
                {sub}
              </Text>
            )}
          </View>
          {statusPill}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.menu.open')}
            onPress={() => setMenuOpen((v) => !v)}
            style={({ pressed }) => [s.more, pressed && { opacity: 0.8 }]}
          >
            <MoreHorizontal size={18} color={c.text} strokeWidth={2} />
          </Pressable>
        </View>
        {/* Beside the timer pill the phone header cuts this line off, so it gets a row of its own. */}
        {!panel && (
          <Text style={[onest('regular', 13), { color: c.muted }]} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>

      <ChatThread chatId={chatId} eventId={eventId} userId={userId} variant={variant} />

      {menuOpen && (
        <>
          <Pressable accessibilityLabel={t('chat.menu.close')} style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <View style={[s.menu, panel ? s.menuPanel : { top: headerTop + 79 }]}>
            {status === 'open' && (
              <MenuItem
                icon={<X size={16} color={c.text} strokeWidth={2} />}
                label={t('chat.menu.closeChat')}
                color={c.text}
                onPress={() => {
                  setMenuOpen(false);
                  dispatch({ type: 'closeChat', chatId });
                }}
              />
            )}
            <MenuItem
              icon={<Flag size={16} color={c.text} strokeWidth={2} />}
              label={t('common.report')}
              color={c.text}
              onPress={() => {
                setMenuOpen(false);
                router.push({ pathname: '/report/[userId]', params: { userId, eventId } });
              }}
            />
            <MenuItem
              icon={<Ban size={16} color={c.danger} strokeWidth={2} />}
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
      <Text style={[onest('medium', 14), { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // W06 menu rows: 12×10 pt padding, 14 pt radius, 16 pt icons.
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    empty: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
    emptyBtn: { marginTop: 8, height: 48, borderRadius: 24, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
    headerBlock: {
      gap: 4,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
      backgroundColor: c.bg,
    },
    // W06 conversation header: 20/16 pt vertical, 28 pt left, 24 pt right.
    headerBlockPanel: { paddingTop: 20, paddingBottom: 16, paddingLeft: 28, paddingRight: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerRowPanel: { gap: 12 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
    more: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    menu: {
      position: 'absolute',
      right: 20,
      width: 240,
      padding: 6,
      borderRadius: 20,
      backgroundColor: c.surface2,
      borderWidth: 1,
      borderColor: c.line,
      boxShadow: '0px 18px 40px rgba(0,0,0,0.45)',
    },
    menuPanel: { top: 70, right: 24 },
  });
