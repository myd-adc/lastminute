import { useLocalSearchParams } from 'expo-router';
import { Check, Send, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glow, glows } from '@/components/profile/Glow';
import { accentText, instrumental, pronouns, shortTitle } from '@/components/profile/names';
import { Avatar, Button, Chip, goBack, Gradient } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent } from '@/data/mock';
import type { Event, Survey, User } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide, footerBottom } from '@/lib/layout';
import { attendeesFor, expiresAt, matchesAt, nextForYou } from '@/lib/selectors';
import { dayLabel, going, time, weekdayShort } from '@/lib/time';
import { pairKey, useNow, useStore } from '@/store/AppStore';
import { display, gradients, onest, type, useTheme } from '@/theme';

const talkedOptions: NonNullable<Survey['talked']>[] = ['many', 'one', 'none'];
// Dictionary keys for the «talked» chips (`one`/`many` would read as a plural entry).
const talkedKey = { many: 'lots', one: 'single', none: 'none' } as const;
const cameWithOptions: NonNullable<Survey['cameWith']>[] = ['match', 'solo', 'friends'];

const normalizeHandle = (v: string) => {
  const t = v.trim().replace(/\s+/g, '');
  if (!t) return '';
  return t.startsWith('@') || t.includes('/') || t.startsWith('+') ? t : `@${t}`;
};

// M15 «Як пройшло?» — after-event survey, mutual contact exchange and the next event for you. W08 on wide web.
export default function AfterScreen() {
  const { c } = useTheme();
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
  const next = nextForYou(state, now, event.id)[0];

  const done = () => {
    dispatch({ type: 'saveSurvey', eventId: event.id, survey: { talked, cameWith } });
    for (const u of matches) {
      const h = normalizeHandle(handles[u.id] ?? '');
      if (h && !state.myContacts[pairKey(event.id, u.id)]) dispatch({ type: 'leaveContact', eventId: event.id, userId: u.id, contact: h });
    }
    goBack('/');
  };

  const body = (
    <>
      {!wide && (
        <View style={styles.topRow}>
          <Text style={[onest('semibold', 14, 18), { color: c.muted, flex: 1 }]} numberOfLines={1}>
            {dayLabel(event.startsAt, now)} · {shortTitle(event.title)}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12} onPress={() => goBack('/')}>
            <X size={22} color={c.text} strokeWidth={2} />
          </Pressable>
        </View>
      )}
      {wide && (
        <Text style={[onest('semibold', 14, 18), { color: c.muted }]} numberOfLines={1}>
          {dayLabel(event.startsAt, now)} · {shortTitle(event.title)}
        </Text>
      )}
      <Text style={[wide ? display(32, 40) : display(28, 35), { color: c.text }, !wide && styles.titleMobile]}>{t('profile.after.title')}</Text>

      <Text style={[onest('semibold', 16, 20), { color: c.text }]}>{t('profile.after.talkedQuestion')}</Text>
      <View style={styles.chips}>
        {talkedOptions.map((o) => (
          <Chip key={o} label={t(`profile.after.talked.${talkedKey[o]}`)} selected={talked === o} onPress={() => setTalked(talked === o ? null : o)} />
        ))}
      </View>

      <Text style={[onest('semibold', 16, 20), { color: c.text }]}>{t('profile.after.cameWithQuestion')}</Text>
      <View style={[styles.chips, !wide && styles.beforeCards]}>
        {cameWithOptions.map((o) => (
          <Chip key={o} label={t(`profile.after.cameWith.${o}`)} selected={cameWith === o} onPress={() => setCameWith(cameWith === o ? null : o)} />
        ))}
      </View>

      {matches.map((u) => (
        <ContactCard
          key={u.id}
          user={u}
          event={event}
          now={now}
          wide={wide}
          left={state.myContacts[pairKey(event.id, u.id)]}
          value={handles[u.id] ?? ''}
          onChange={(v) => setHandles((h) => ({ ...h, [u.id]: v }))}
          onSend={() => {
            const h = normalizeHandle(handles[u.id] ?? '');
            if (h) dispatch({ type: 'leaveContact', eventId: event.id, userId: u.id, contact: h });
          }}
        />
      ))}

      {next && <NextEvent event={next} matches={matches} wide={wide} />}
    </>
  );

  const footer = <Button label={t('common.done')} onPress={done} />;

  if (wide) {
    // W08: 640 pt dialog (surface, 1 pt line border, radius 28, 40 pt padding) over the dimmed shell.
    return (
      <View style={[styles.flex, styles.centre, { backgroundColor: c.scrim }]}>
        <Pressable accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={() => goBack('/')} />
        <View style={[styles.dialog, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Glow blobs={glows.afterWide} />
          <ScrollView contentContainerStyle={styles.dialogContent} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
          <View style={styles.dialogFooter}>{footer}</View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => goBack('/')}
            style={[styles.dialogClose, { backgroundColor: c.surface2 }]}
          >
            <X size={18} color={c.text} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    );
  }

  // M15: the top row sits 8 pt under the status bar (safe-area inset on device); 56 pt «Готово» pinned at the bottom.
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Glow blobs={glows.after} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8 }]}
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
  wide,
  left,
  value,
  onChange,
  onSend,
}: {
  user: User;
  event: Event;
  now: number;
  wide: boolean;
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
  // M15: surface card, 16 pt padding; W08: bg-coloured card inside the surface dialog, 18 pt padding.
  return (
    <View style={[styles.card, { backgroundColor: wide ? c.bg : c.surface, borderColor: c.line, padding: wide ? 18 : 16 }]}>
      <View style={styles.cardHead}>
        <Avatar name={user.name} gradient={user.gradient} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[onest('bold', wide ? 16 : 15, wide ? 20 : 19), { color: c.text }]}>{t('profile.after.contactTitle', { name: instrumental(user.name, lang) })}</Text>
          <Text style={[onest('regular', 13, 17), { color: accent }]}>
            {t('profile.after.chatCloses', { day: dayLabel(closes, now).toLowerCase(), time: time(closes) })}
          </Text>
        </View>
      </View>

      {left ? (
        <View style={[styles.field, { borderColor: c.line, backgroundColor: c.surface2 }]}>
          <Check size={18} color={accent} strokeWidth={2.5} />
          <Text style={[onest('medium', 15), { color: c.text, flex: 1 }]}>{left}</Text>
          <Text style={[onest('regular', 13), { color: c.muted }]}>{t('profile.after.left')}</Text>
        </View>
      ) : (
        <View style={[styles.field, { borderColor: c.accent, backgroundColor: wide ? c.surface : c.bg }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.after.leaveContact')} hitSlop={8} onPress={onSend} disabled={!value.trim()}>
            <Send size={18} color={value.trim() ? gradients.aurora[0] : c.muted} strokeWidth={2} />
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
            style={[styles.input, onest('medium', 15), { color: c.text }]}
          />
          <Text style={[onest('regular', 13), { color: c.muted }]}>Telegram</Text>
        </View>
      )}

      <Text style={[onest('regular', 13, 18), { color: c.muted }]}>
        {left ? t('profile.after.seesIfLeft', params) : t('profile.after.seesOnlyIf', params)}
      </Text>
    </View>
  );
}

function NextEvent({ event, matches, wide }: { event: Event; matches: User[]; wide: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const attending = new Set(attendeesFor(state, event.id).map((a) => a.user.id));
  const friend = matches.find((m) => attending.has(m.id));
  const amGoing = !!state.going[event.id];
  const count = event.goingCount + (amGoing ? 1 : 0);
  const meta = [`${weekdayShort(event.startsAt)} ${time(event.startsAt)}`, going(count), friend && t('profile.after.friendToo', { name: friend.name })].filter(Boolean).join(' · ');
  const pill = [styles.goPill, wide && styles.goPillWide];
  const pillText = onest('bold', wide ? 13 : 12);
  // M15: surface, padding 10/12; W08: surface2, padding 12, larger type.
  return (
    <View style={[styles.next, wide ? { padding: 12, backgroundColor: c.surface2 } : { backgroundColor: c.surface }]}>
      <Gradient id={event.poster.gradient} style={styles.thumb} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[onest('semibold', wide ? 15 : 14, wide ? 19 : 18), { color: c.text }]} numberOfLines={1}>
          {t('profile.after.nextForYou', { title: event.title })}
        </Text>
        <Text style={[onest('regular', wide ? 13 : 12, wide ? 17 : 15), { color: c.muted }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {amGoing ? (
        <View style={[pill, { backgroundColor: wide ? c.surface : c.surface2 }]}>
          <Text style={[pillText, { color: c.text }]}>{t('common.youreGoing')}</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch({ type: 'go', eventId: event.id })}
          style={({ pressed }) => [pill, { backgroundColor: c.accent }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[pillText, { color: c.onAccent }]}>{t(wide ? 'profile.after.goWide' : 'profile.after.go')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 32, marginBottom: -2 },
  // Figma: 2 pt spacer frames inside the 12 pt column gap, after the title and before the contact card.
  titleMobile: { marginBottom: 14 },
  beforeCards: { marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: 20, borderWidth: 1, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14 },
  input: { flex: 1, height: '100%', paddingVertical: 0 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 10, paddingRight: 12, paddingVertical: 10, borderRadius: 18 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  goPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  goPillWide: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  dialog: { width: 640, height: 760, maxWidth: '94%', maxHeight: '94%', borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  dialogContent: { paddingHorizontal: 40, paddingTop: 40, paddingBottom: 16, gap: 14 },
  dialogFooter: { paddingHorizontal: 40, paddingBottom: 24, paddingTop: 8 },
  dialogClose: { position: 'absolute', top: 19, right: 21, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
