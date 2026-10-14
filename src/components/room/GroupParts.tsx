import { router } from 'expo-router';
import { Check, MapPin, MoreHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { soloGroups } from '@/data/mock';
import type { Event, User } from '@/data/types';
import { useT } from '@/i18n';
import { t as translate } from '@/i18n/translate';
import { decisionOf, isMatch, soloGroupMembers } from '@/lib/selectors';
import { useStore } from '@/store/AppStore';
import { display, fonts, onest, type, useTheme } from '@/theme';

import { Face, Faces } from './Face';
import { byGender, writeTo } from './text';

export const useAccentText = () => useTheme().c.accentInk;

export const membersLabel = (n: number) => translate('common.count.participants', { count: n });

// Everything the "Solo at …" screens need, derived once.
export function useSoloGroup(event: Event) {
  const { state, dispatch } = useStore();
  const group = soloGroups[event.id];
  const members = soloGroupMembers(state, event.id);
  const going = state.going[event.id];
  const hasAccess = !!going && going.with === 'solo' && going.joinSoloGroup;
  const meConfirmed = !!state.groupMeetConfirmed[event.id];
  const confirmedUsers = members.filter((u) => group?.confirmed.includes(u.id));
  return {
    state,
    group,
    members,
    hasAccess,
    meConfirmed,
    confirmedUsers,
    total: members.length + 1,
    confirmedCount: confirmedUsers.length + (meConfirmed ? 1 : 0),
    toggleMeet: () => dispatch({ type: 'toggleGroupMeet', eventId: event.id }),
    join: () => {
      if (!going) dispatch({ type: 'go', eventId: event.id });
      dispatch({ type: 'setGoing', eventId: event.id, patch: { with: 'solo', joinSoloGroup: true } });
    },
    leave: () => dispatch({ type: 'setGoing', eventId: event.id, patch: { joinSoloGroup: false } }),
  };
}

type Group = ReturnType<typeof useSoloGroup>;

// "Meeting point" card with the "I'll be there ✓" toggle (Figma "Pinned meeting point").
export function MeetCard({ g, showMenu = true }: { g: Group; showMenu?: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const accentText = useAccentText();
  const [menu, setMenu] = useState(false);
  if (!g.group) return null;
  const me = g.state.me;
  const people = [
    ...g.confirmedUsers.map((u) => ({ name: u.name, gradient: u.gradient })),
    ...(g.meConfirmed && me ? [{ name: me.name, gradient: me.gradient, photoUri: me.photoUri }] : []),
  ];
  return (
    <View style={[styles.meet, { borderColor: c.accent, backgroundColor: c.surface }]}>
      <View style={styles.rowCenter}>
        <MapPin size={16} color={accentText} strokeWidth={2} />
        <Text style={[onest('semibold', 12, 15), { color: c.muted, flex: 1 }]}>{t('room.group.meetingPoint')}</Text>
        {showMenu && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('room.group.menu')} hitSlop={10} onPress={() => setMenu((m) => !m)}>
            <MoreHorizontal size={16} color={c.muted} strokeWidth={2} />
          </Pressable>
        )}
      </View>
      <Text style={[display(20, 25), { color: c.text }]}>
        {t('room.group.meetAt', { place: g.group.meetPlace, time: g.group.meetTime })}
      </Text>
      <View style={[styles.rowCenter, { gap: 10 }]}>
        {people.length > 0 && <Faces people={people.slice(0, 5)} size={24} fontSize={10} />}
        <Text style={[onest('medium', 13, 17), { color: c.muted, flex: 1 }]}>
          {t('room.group.confirmed', { count: g.confirmedCount, total: g.total })}
        </Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: g.meConfirmed }}
          onPress={g.toggleMeet}
          style={({ pressed }) => [
            styles.meetPill,
            g.meConfirmed ? { backgroundColor: c.accent } : [styles.meetPillOff, { borderColor: c.accent }],
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[onest('bold', 12, 15), { color: g.meConfirmed ? c.onAccent : accentText }]}>
            {t(g.meConfirmed ? 'room.group.imThereOn' : 'room.group.imThere')}
          </Text>
        </Pressable>
      </View>
      {menu && (
        <View style={[styles.menu, { borderTopColor: c.line }]}>
          <Pressable
            onPress={() => {
              setMenu(false);
              router.push('/rules');
            }}
            style={styles.menuItem}
          >
            <Text style={[type.callout, { color: c.text }]}>{t('room.group.communityRules')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenu(false);
              g.leave();
            }}
            style={styles.menuItem}
          >
            <Text style={[type.callout, { color: c.danger }]}>{t('room.group.leave')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Shown when the user is not in the group (not going solo or opted out on M08).
export function GroupGate({ event, g }: { event: Event; g: Group }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View style={styles.gate}>
      <Text style={{ fontSize: 52 }}>🙋</Text>
      <Text style={[type.title2, { color: c.text, textAlign: 'center' }]}>
        {g.group ? t('room.group.gateTitle') : t('room.group.noGroupTitle')}
      </Text>
      <Text style={[type.body, { color: c.muted, textAlign: 'center' }]}>
        {g.group
          ? t('room.group.gateBody', { members: membersLabel(g.members.length), event: event.title })
          : t('room.group.noGroupBody')}
      </Text>
      {g.group && (
        <Button label={t('room.group.addMe')} onPress={g.join} style={styles.gateBtn} />
      )}
    </View>
  );
}

// W05b right panel row: a member with «👋» (decide go on them from the group).
function MemberRow({ event, user, confirmed }: { event: Event; user: User; confirmed: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const accentText = useAccentText();
  const { state, decide } = useStore();
  const decided = decisionOf(state, event.id, user.id) === 'go';
  const matched = isMatch(state, event.id, user.id);
  const wave = () => {
    if (matched) {
      router.push({ pathname: '/chat/[eventId]/[userId]', params: { eventId: event.id, userId: user.id } });
      return;
    }
    decide(event.id, user.id, 'go').then((m) => m && router.push({ pathname: '/match/[eventId]/[userId]', params: { eventId: event.id, userId: user.id } }));
  };
  return (
    <View style={styles.member}>
      <Face name={user.name} gradient={user.gradient} photoUri={user.photoUri} size={40} fontSize={16} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{user.name}</Text>
        <Text style={[onest('regular', 12, 15), { color: confirmed ? accentText : c.muted }]} numberOfLines={1}>
          {user.affiliation} · {confirmed ? t('room.group.memberConfirmed') : t(byGender(user, 'room.group.noReplyF', 'room.group.noReplyM'))}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={matched ? writeTo(user.name) : decided ? t('room.group.alreadyWaved') : t('room.group.goWith', { name: user.name })}
        disabled={decided && !matched}
        onPress={wave}
        style={[styles.waveBtn, { backgroundColor: decided ? c.accent : c.surface2 }]}
      >
        <Text style={{ fontSize: 16 }}>{matched ? '💬' : '👋'}</Text>
      </Pressable>
    </View>
  );
}

// W05b right panel: members, rules, leave.
export function GroupMembersPanel({ event, g }: { event: Event; g: Group }) {
  const { c } = useTheme();
  const { t } = useT();
  const accentText = useAccentText();
  const me = g.state.me;
  const rules = [t('room.group.rule1'), t('room.group.rule2'), t('room.group.rule3'), t('room.group.rule4')];
  return (
    <View style={[styles.panel, { borderLeftColor: c.line, backgroundColor: c.surface }]}>
      <Text style={[styles.panelTitle, { color: c.text }]}>{t('room.group.members', { count: g.total })}</Text>
      <View style={{ gap: 2 }}>
        {me && (
          <View style={styles.member}>
            <Face name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={40} fontSize={16} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{t('room.group.you', { name: me.name })}</Text>
              <Text style={[onest('regular', 12, 15), { color: g.meConfirmed ? accentText : c.muted }]} numberOfLines={1}>
                {[me.affiliation, g.meConfirmed ? t('room.group.meConfirmed') : t('room.group.meNotYet')].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        )}
        {g.members.map((u) => (
          <MemberRow key={u.id} event={event} user={u} confirmed={!!g.group?.confirmed.includes(u.id)} />
        ))}
      </View>
      <View style={[styles.rules, { backgroundColor: c.bg }]}>
        <Text style={[onest('semibold', 14, 18), { color: c.text }]}>{t('room.group.howItWorks')}</Text>
        {rules.map((r) => (
          <View key={r} style={styles.rule}>
            <Check size={16} color={accentText} strokeWidth={2.6} />
            <Text style={[onest('regular', 13, 18), { color: c.muted, flex: 1 }]}>{r}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Pressable onPress={g.leave} style={({ pressed }) => [styles.leave, { borderColor: c.line }, pressed && { opacity: 0.8 }]}>
        <Text style={[onest('semibold', 14, 18), { color: c.text }]}>{t('room.group.leave')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meet: { borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  meetPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  meetPillOff: { borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  menu: { borderTopWidth: 1, marginTop: 4, paddingTop: 4 },
  menuItem: { paddingVertical: 10 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  gateBtn: { alignSelf: 'stretch', marginTop: 8 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  waveBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  panel: { width: 400, borderLeftWidth: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, gap: 14 },
  panelTitle: { fontFamily: fonts.displaySemibold, fontSize: 16, lineHeight: 20 },
  rules: { borderRadius: 16, padding: 16, gap: 10 },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  leave: { paddingVertical: 12, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
