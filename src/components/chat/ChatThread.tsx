import { router } from 'expo-router';
import { Hourglass, Image as ImageIcon, Lock, Send, Shield } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { footerBottom } from '@/lib/layout';
import { Avatar } from '@/components/ui';
import { attendanceOf, getEvent, getUser } from '@/data/mock';
import type { Message } from '@/data/types';
import { useT } from '@/i18n';
import { albumOpen, chatState, expiresAt, isPast, messagesOf } from '@/lib/selectors';
import { time } from '@/lib/time';
import { pairKey, useNow, useStore } from '@/store/AppStore';
import { onest, type Palette, type Scheme, useStyles, useTheme } from '@/theme';

import { accentInk, eventShort, genderKey, nameObject, senderInk } from './chatUtils';

export type ChatThreadProps = {
  chatId: string; // dmChatId(eventId, userId) or groupChatId(eventId)
  eventId: string;
  userId?: string; // DM partner; omitted for the «Самі на …» group
  // 'screen' = full M13/M08b screen body (composer pinned at bottom);
  // 'panel' = embedded right-hand panel on wide web (W05/W06).
  variant: 'screen' | 'panel';
};

// Shared chat thread: system card, bubbles, album teaser, quick replies, composer and the after-event contact bar.
export function ChatThread({ chatId, eventId, userId, variant }: ChatThreadProps) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { state, dispatch, sendMessage } = useStore();
  const now = useNow();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');

  const event = getEvent(eventId);
  const partner = userId ? getUser(userId) : undefined;
  const isGroup = !userId;
  const messages = useMemo(() => messagesOf(state, chatId), [state, chatId]);
  const last = messages.at(-1);

  // Mark everything read when the thread opens and whenever a message arrives while it is on screen.
  const lastRead = state.lastRead[chatId];
  useEffect(() => {
    const target = [new Date(now).toISOString(), last?.at ?? ''].sort().at(-1)!;
    if (!lastRead || lastRead < (last?.at ?? '')) dispatch({ type: 'markRead', chatId, at: target });
  }, [chatId, last?.at, lastRead, now, dispatch]);

  if (!event) return null;

  const status = chatState(state, event, userId ?? null, now);
  const past = isPast(event, now);
  const expired = now >= expiresAt(event);
  const manuallyClosed = !!state.closedChats[chatId];
  const canWrite = status === 'open' || (status === 'contact' && !expired && !manuallyClosed);
  const myContact = userId ? state.myContacts[pairKey(eventId, userId)] : undefined;
  const theirContact = userId ? attendanceOf(eventId, userId)?.leavesContact : undefined;
  const meName = state.me?.name ?? t('chat.thread.me');
  const ink = accentInk(c, scheme);

  const send = (text: string) => {
    const msg = text.trim();
    if (!msg || !canWrite) return;
    sendMessage(chatId, msg);
  };
  const submitDraft = () => {
    send(draft);
    setDraft('');
  };

  const quick = [t('chat.thread.quickHere'), t('chat.thread.quickLate')];
  const replies = variant === 'panel' ? [...quick, t('chat.thread.quickBar')] : quick;
  const albumIsOpen = albumOpen(event, now);

  const body = (
    <View style={s.flex}>
      <ScrollView
        ref={scrollRef}
        style={s.flex}
        contentContainerStyle={[s.scroll, variant === 'panel' && s.scrollPanel]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {isGroup ? (
          <View style={s.systemRow}>
            <Shield size={18} color={ink} strokeWidth={2} />
            <Text style={[s.systemText, { flex: 1 }]}>{t('chat.thread.groupIntro')}</Text>
          </View>
        ) : (
          <View style={s.systemCard}>
            <Text style={s.systemTitle}>
              {t('chat.thread.dmIntroTitle', { event: eventShort(event) })}
              {variant === 'panel' ? ` · ${time(event.startsAt)}` : ''}
            </Text>
            <Text style={s.systemText}>
              {t('chat.thread.dmIntroText')}
            </Text>
          </View>
        )}

        {messages.map((m, i) => (
          <Bubble
            key={m.id}
            m={m}
            showSender={isGroup && m.from !== 'me' && m.from !== 'system' && messages[i - 1]?.from !== m.from}
            showAvatar={isGroup && m.from !== 'me' && m.from !== 'system' && messages[i + 1]?.from !== m.from}
            isGroup={isGroup}
            s={s}
            c={c}
            scheme={scheme}
          />
        ))}

        {!expired && (
          <Pressable
            disabled={!albumIsOpen}
            onPress={() => router.push({ pathname: '/event/[id]/album', params: { id: eventId } })}
            style={({ pressed }) => [s.album, albumIsOpen && { borderColor: c.accent }, pressed && { opacity: 0.8 }]}
          >
            <ImageIcon size={22} color={ink} strokeWidth={2} />
            <View style={s.flex}>
              <Text style={s.albumTitle}>
                {albumIsOpen ? t('chat.thread.albumOpen') : t('chat.thread.albumOpensAt', { time: time(event.startsAt) })}
              </Text>
              <Text style={s.systemTextLeft}>{t('chat.thread.albumNote')}</Text>
            </View>
          </Pressable>
        )}

        {status === 'contact' && theirContact && (
          <View style={s.contactCard}>
            <Text style={s.contactLabel}>{t('chat.thread.theirContact', { contact: theirContact })}</Text>
            <Text style={s.systemTextLeft}>
              {myContact ? t('chat.thread.bothLeftContactMine', { contact: myContact }) : t('chat.thread.bothLeftContact')}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[s.bottom, variant === 'screen' ? { paddingBottom: footerBottom(insets.bottom) + 14 } : s.bottomPanel]}>
        {!isGroup && partner && past && status === 'open' && (
          <ContactBar
            name={partner.name}
            gender={genderKey(partner)}
            myContact={myContact}
            onSave={(contact) => dispatch({ type: 'leaveContact', eventId, userId: partner.id, contact })}
            s={s}
            c={c}
            ink={ink}
          />
        )}

        {status === 'waiting' && partner && (
          <View style={s.notice}>
            <Hourglass size={18} color={c.muted} />
            <Text style={[s.noticeText, s.flex]}>{t('chat.thread.waitingNotice', { name: partner.name })}</Text>
          </View>
        )}

        {!canWrite && status !== 'waiting' && (
          <View style={s.notice}>
            <Lock size={18} color={c.muted} />
            <Text style={[s.noticeText, s.flex]}>
              {manuallyClosed
                ? t('chat.thread.closedByMe')
                : t('chat.thread.closedExpired')}
            </Text>
          </View>
        )}

        {canWrite && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.replies} keyboardShouldPersistTaps="handled">
              {replies.map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  onPress={() => send(r)}
                  style={({ pressed }) => [s.reply, pressed && { backgroundColor: c.surface2 }]}
                >
                  <Text style={s.replyText}>{r}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={s.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={
                  isGroup
                    ? t('chat.thread.placeholderGroup')
                    : variant === 'panel' && Platform.OS === 'web'
                      ? t('chat.thread.placeholderWeb')
                      : t('chat.thread.placeholder')
                }
                placeholderTextColor={c.muted}
                style={s.input}
                returnKeyType="send"
                submitBehavior="submit"
                onSubmitEditing={submitDraft}
                accessibilityLabel={t('chat.thread.inputLabel', { name: meName })}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('chat.thread.send')}
                onPress={submitDraft}
                style={({ pressed }) => [s.send, variant === 'panel' && s.sendPanel, pressed && { opacity: 0.85 }]}
              >
                <Send size={22} color={c.onAccent} strokeWidth={2} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (variant === 'panel' || Platform.OS !== 'ios') return body;
  return (
    <KeyboardAvoidingView style={s.flex} behavior="padding">
      {body}
    </KeyboardAvoidingView>
  );
}

function Bubble({
  m,
  showSender,
  showAvatar,
  isGroup,
  s,
  c,
  scheme,
}: {
  m: Message;
  showSender: boolean;
  showAvatar: boolean;
  isGroup: boolean;
  s: Styles;
  c: Palette;
  scheme: Scheme;
}) {
  if (m.from === 'system') {
    return <Text style={[s.systemText, { marginVertical: 4 }]}>{m.text}</Text>;
  }
  const mine = m.from === 'me';
  const author = mine ? undefined : getUser(m.from);
  const bubble = (
    <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
      {showSender && author && <Text style={[onest('semibold', 13), { color: senderInk(c, scheme), marginBottom: 2 }]}>{author.name}</Text>}
      <Text style={[s.bubbleText, { color: mine ? c.onAccent : c.text }]}>{m.text}</Text>
      <Text style={[s.stamp, { color: mine ? 'rgba(11,11,16,0.55)' : c.muted }]}>{time(m.at)}</Text>
    </View>
  );
  if (mine) return <View style={s.rowMine}>{bubble}</View>;
  if (!isGroup) return <View style={s.rowTheirs}>{bubble}</View>;
  return (
    <View style={[s.rowTheirs, s.groupRow]}>
      <View style={s.avatarSlot}>{showAvatar && author && <Avatar name={author.name} gradient={author.gradient} size={28} />}</View>
      {bubble}
    </View>
  );
}

function ContactBar({
  name,
  gender,
  myContact,
  onSave,
  s,
  c,
  ink,
}: {
  name: string;
  gender: 'f' | 'm';
  myContact?: string;
  onSave: (contact: string) => void;
  s: Styles;
  c: Palette;
  ink: string;
}) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [handle, setHandle] = useState('@');
  const valid = handle.replace('@', '').trim().length >= 2;
  const save = () => {
    if (!valid) return;
    onSave(handle.trim());
    setEditing(false);
  };

  if (myContact) {
    return (
      <View style={s.contactBar}>
        <Send size={20} color={ink} strokeWidth={2} />
        <View style={s.flex}>
          <Text style={s.contactTitle}>{t('chat.contact.savedTitle', { contact: myContact })}</Text>
          <Text style={s.systemTextLeft}>
            {t(`chat.contact.savedNote.${gender}`, { name })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.contactBar}>
      {editing ? (
        <View style={[s.flex, { gap: 8 }]}>
          <Text style={s.contactTitle}>{t('chat.contact.telegram')}</Text>
          <View style={s.handleRow}>
            <TextInput
              value={handle}
              onChangeText={setHandle}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="@username"
              placeholderTextColor={c.muted}
              style={s.handleInput}
              returnKeyType="done"
              onSubmitEditing={save}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!valid}
              onPress={save}
              style={({ pressed }) => [s.contactBtn, { backgroundColor: c.accent }, !valid && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[onest('bold', 15), { color: c.onAccent }]}>{t('chat.contact.save')}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setEditing(false)} hitSlop={8}>
            <Text style={[onest('medium', 13), { color: c.muted }]}>{t('chat.contact.cancel')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Send size={20} color={ink} strokeWidth={2} />
          <View style={s.flex}>
            <Text style={s.contactTitle}>{t('chat.contact.askTitle', { name: nameObject(name) })}</Text>
            <Text style={s.systemTextLeft}>
              {t(`chat.contact.askNote.${gender}`)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
            style={({ pressed }) => [s.contactBtn, { backgroundColor: c.surface2 }, pressed && { opacity: 0.85 }]}
          >
            <Text style={[onest('bold', 15), { color: c.text }]}>{t('chat.contact.leave')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (c: Palette, scheme: Scheme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 10 },
    scrollPanel: { paddingHorizontal: 24, paddingTop: 20 },
    systemCard: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4, marginBottom: 6 },
    systemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 6,
    },
    systemTitle: { ...onest('semibold', 14, 19), color: c.text, textAlign: 'center' },
    systemText: { ...onest('regular', 12, 16), color: c.muted, textAlign: 'center' },
    systemTextLeft: { ...onest('regular', 12, 16), color: c.muted },
    rowMine: { flexDirection: 'row', justifyContent: 'flex-end' },
    rowTheirs: { flexDirection: 'row', justifyContent: 'flex-start' },
    groupRow: { alignItems: 'flex-end', gap: 8 },
    avatarSlot: { width: 28 },
    bubble: { maxWidth: '78%', borderRadius: 20, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
    bubbleMine: { backgroundColor: c.accent, borderBottomRightRadius: 6 },
    bubbleTheirs: { backgroundColor: scheme === 'light' ? c.surface : c.surface2, borderBottomLeftRadius: 6 },
    bubbleText: { ...onest('regular', 15, 21) },
    stamp: { ...onest('regular', 11, 14), alignSelf: 'flex-end', marginTop: 2 },
    album: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.line,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginTop: 6,
    },
    albumTitle: { ...onest('semibold', 14, 19), color: c.text },
    contactCard: { backgroundColor: c.accentSoft, borderRadius: 16, padding: 14, gap: 4, borderWidth: 1, borderColor: c.accent },
    contactLabel: { ...onest('bold', 15, 20), color: c.text },
    bottom: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
    bottomPanel: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 20, gap: 12 },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 0,
    },
    noticeText: { ...onest('medium', 14, 19), color: c.muted },
    replies: { gap: 8, paddingHorizontal: 0 },
    reply: {
      height: 40,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      justifyContent: 'center',
    },
    replyText: { ...onest('medium', 14), color: c.text },
    composer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input: {
      flex: 1,
      height: 52,
      borderRadius: 24,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 18,
      color: c.text,
      ...onest('regular', 15),
    },
    send: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
    sendPanel: { width: 44, height: 44, borderRadius: 22 },
    contactBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: scheme === 'light' ? c.accentSoft : 'rgba(215,255,59,0.08)',
      borderRadius: 16,
      padding: 14,
    },
    contactTitle: { ...onest('semibold', 14, 19), color: c.text },
    contactBtn: { height: 44, borderRadius: 22, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
    handleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    handleInput: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 16,
      color: c.text,
      ...onest('regular', 15),
    },
  });
