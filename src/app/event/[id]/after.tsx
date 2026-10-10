import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Check, Send, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accentText, instrumental, pronouns, shortTitle } from '@/components/profile/names';
import { Avatar, Button, Chip, goBack, Gradient } from '@/components/ui';
import { getEvent } from '@/data/mock';
import type { Event, Survey, User } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { attendeesFor, expiresAt, matchesAt, nextOnScene } from '@/lib/selectors';
import { dayLabel, going, time, weekdayShort } from '@/lib/time';
import { pairKey, useNow, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

const talkedOptions: NonNullable<Survey['talked']>[] = ['many', 'one', 'none'];
// Dictionary keys for the «talked» chips (`one`/`many` would read as a plural entry).
const talkedKey = { many: 'lots', one: 'single', none: 'none' } as const;
const cameWithOptions: NonNullable<Survey['cameWith']>[] = ['match', 'solo', 'friends'];

const normalizeHandle = (v: string) => {
  const t = v.trim().replace(/\s+/g, '');
  if (!t) return '';
  return t.startsWith('@') || t.includes('/') || t.startsWith('+') ? t : `@${t}`;
};

// M15 «Як пройшло?» — after-event survey, mutual contact exchange and the next event on the scene. W08 on wide web.
export default function AfterScreen() {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const now = useNow();
  const wide = useIsWide();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEvent(id);

  const saved = state.surveys[id];
  const [talked, setTalked] = useState<Survey['talked']>(saved?.talked ?? null);
  const [cameWith, setCameWith] = useState<Survey['cameWith']>(saved?.cameWith ?? null);
  const [handles, setHandles] = useState<Record<string, string>>({});

  if (!event) {
    return (
      <View style={[styles.flex, styles.centre, { backgroundColor: c.bg, padding: 20, gap: 16 }]}>
        <Text style={[type.headline, { color: c.text }]}>{t('profile.after.notFound')}</Text>
        <Button label={t('common.close')} variant="secondary" onPress={() => goBack('/')} />
      </View>
    );
  }

  const matches = matchesAt(state, event.id);
  const next = nextOnScene(state, now, event.id)[0];

  const done = () => {
    dispatch({ type: 'saveSurvey', eventId: event.id, survey: { talked, cameWith } });
    for (const u of matches) {
      const h = normalizeHandle(handles[u.id] ?? '');
      if (h && !state.myContacts[pairKey(event.id, u.id)]) dispatch({ type: 'leaveContact', eventId: event.id, userId: u.id, contact: h });
    }
    goBack('/');
  };

  const glow = scheme === 'light'
    ? (['rgba(255,138,61,0.30)', 'rgba(255,61,139,0.20)', 'rgba(246,245,241,0)'] as const)
    : (['rgba(255,61,139,0.30)', 'rgba(124,92,255,0.16)', 'rgba(11,11,16,0)'] as const);

  const body = (
    <>
      <View style={styles.topRow}>
        <Text style={[type.footnoteStrong, { color: c.muted, flex: 1 }]} numberOfLines={1}>
          {dayLabel(event.startsAt, now)} · {shortTitle(event.title)}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12} onPress={() => goBack('/')}>
          <X size={24} color={c.text} strokeWidth={2} />
        </Pressable>
      </View>
      <Text style={[display(32, 38), { color: c.text }]}>{t('profile.after.title')}</Text>

      <View style={styles.group}>
        <Text style={[type.bodyStrong, { color: c.text }]}>{t('profile.after.talkedQuestion')}</Text>
        <View style={styles.chips}>
          {talkedOptions.map((o) => (
            <Chip key={o} label={t(`profile.after.talked.${talkedKey[o]}`)} selected={talked === o} onPress={() => setTalked(talked === o ? null : o)} />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[type.bodyStrong, { color: c.text }]}>{t('profile.after.cameWithQuestion')}</Text>
        <View style={styles.chips}>
          {cameWithOptions.map((o) => (
            <Chip key={o} label={t(`profile.after.cameWith.${o}`)} selected={cameWith === o} onPress={() => setCameWith(cameWith === o ? null : o)} />
          ))}
        </View>
      </View>

      {matches.map((u) => (
        <ContactCard
          key={u.id}
          user={u}
          event={event}
          now={now}
          left={state.myContacts[pairKey(event.id, u.id)]}
          value={handles[u.id] ?? ''}
          onChange={(v) => setHandles((h) => ({ ...h, [u.id]: v }))}
          onSend={() => {
            const h = normalizeHandle(handles[u.id] ?? '');
            if (h) dispatch({ type: 'leaveContact', eventId: event.id, userId: u.id, contact: h });
          }}
        />
      ))}

      {next && <NextEvent event={next} matches={matches} />}
    </>
  );

  const footer = <Button label={t('common.done')} onPress={done} style={{ height: 60, borderRadius: 30 }} />;

  if (wide) {
    // W08: centred dialog over the dimmed shell.
    return (
      <View style={[styles.flex, styles.centre, { backgroundColor: c.scrim }]}>
        <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={() => goBack('/')} />
        <View style={[styles.dialog, { backgroundColor: c.bg, borderColor: c.line }]}>
          <LinearGradient colors={glow} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 1 }} style={styles.glow} />
          <ScrollView contentContainerStyle={styles.dialogContent} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
          <View style={styles.dialogFooter}>{footer}</View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={glow} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 1 }} style={styles.glow} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        {body}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: footerBottom(insets.bottom) }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

function ContactCard({
  user,
  event,
  now,
  left,
  value,
  onChange,
  onSend,
}: {
  user: User;
  event: Event;
  now: number;
  left?: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  const { c, scheme } = useTheme();
  const { t, lang } = useT();
  const accent = accentText(c, scheme);
  const params = { name: user.name, ...pronouns(user, lang) };
  const closes = new Date(expiresAt(event)).toISOString();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={styles.cardHead}>
        <Avatar name={user.name} gradient={user.gradient} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[onest('bold', 16, 21), { color: c.text }]}>{t('profile.after.contactTitle', { name: instrumental(user.name, lang) })}</Text>
          <Text style={[type.footnoteStrong, { color: accent }]}>
            {t('profile.after.chatCloses', { day: dayLabel(closes, now).toLowerCase(), time: time(closes) })}
          </Text>
        </View>
      </View>

      {left ? (
        <View style={[styles.field, { borderColor: c.line, backgroundColor: c.surface2 }]}>
          <Check size={20} color={accent} strokeWidth={2.5} />
          <Text style={[onest('semibold', 16), { color: c.text, flex: 1 }]}>{left}</Text>
          <Text style={[type.footnote, { color: c.muted }]}>{t('profile.after.left')}</Text>
        </View>
      ) : (
        <View style={[styles.field, { borderColor: c.accent, backgroundColor: scheme === 'light' ? c.accentSoft : c.bg }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.after.leaveContact')} hitSlop={8} onPress={onSend} disabled={!value.trim()}>
            <Send size={20} color={value.trim() ? accent : c.muted} strokeWidth={2} />
          </Pressable>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="@handle"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={onSend}
            style={[styles.input, onest('semibold', 16), { color: c.text }]}
          />
          <Text style={[type.footnote, { color: c.muted }]}>Telegram</Text>
        </View>
      )}

      <Text style={[type.footnote, { color: c.muted }]}>
        {left ? t('profile.after.seesIfLeft', params) : t('profile.after.seesOnlyIf', params)}
      </Text>
    </View>
  );
}

function NextEvent({ event, matches }: { event: Event; matches: User[] }) {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const attending = new Set(attendeesFor(state, event.id).map((a) => a.user.id));
  const friend = matches.find((m) => attending.has(m.id));
  const amGoing = !!state.going[event.id];
  const count = event.goingCount + (amGoing ? 1 : 0);
  const meta = [`${weekdayShort(event.startsAt)} ${time(event.startsAt)}`, going(count), friend && t('profile.after.friendToo', { name: friend.name })].filter(Boolean).join(' · ');
  return (
    <View style={[styles.next, { backgroundColor: c.surface }]}>
      <Gradient id={event.poster.gradient} style={styles.thumb} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: c.text }]} numberOfLines={1}>
          {t('profile.after.nextOnScene', { title: event.title })}
        </Text>
        <Text style={[type.footnote, { color: c.muted }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {amGoing ? (
        <View style={[styles.goPill, { backgroundColor: c.surface2 }]}>
          <Text style={[onest('bold', 13), { color: c.text }]}>{t('common.youreGoing')}</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch({ type: 'go', eventId: event.id })}
          style={({ pressed }) => [styles.goPill, { backgroundColor: c.accent }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[onest('bold', 13), { color: c.onAccent }]}>{t('profile.after.go')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
  group: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14 },
  input: { flex: 1, height: '100%', paddingVertical: 0 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  goPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  dialog: { width: 560, maxHeight: '90%', borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  dialogContent: { padding: 28, gap: 20 },
  dialogFooter: { paddingHorizontal: 28, paddingBottom: 28, paddingTop: 8 },
});
