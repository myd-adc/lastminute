import { router } from 'expo-router';
import { Check, MapPin, MoreHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, AvatarStack, Button } from '@/components/ui';
import { attendanceOf, soloGroups } from '@/data/mock';
import type { Event, User } from '@/data/types';
import { useT } from '@/i18n';
import { t as translate } from '@/i18n/translate';
import { decisionOf, isMatch, soloGroupMembers } from '@/lib/selectors';
import { useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

import { byGender, writeTo } from './text';

export const useAccentText = () => {
  const { c, scheme } = useTheme();
  return scheme === 'light' ? '#5A7A00' : c.accent;
};

export const membersLabel = (n: number) => translate('common.count.participants', { count: n });

// Everything the «Самі на …» screens need, derived once.
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

// «Точка зустрічі» card with the «Я буду ✓» toggle.
export function MeetCard({ g, showMenu = true }: { g: Group; showMenu?: boolean }) {
  const { c } = useTheme();
  const { t } = useT();
  const accentText = useAccentText();
  const [menu, setMenu] = useState(false);
  if (!g.group) return null;
  const me = g.state.me;
  const people = [
    ...g.confirmedUsers.map((u) => ({ name: u.name, gradient: u.gradient })),
    ...(g.meConfirmed && me ? [{ name: me.name, gradient: me.gradient }] : []),
  ];
  return (
    <View style={[styles.meet, { borderColor: c.accent, backgroundColor: c.surface }]}>
      <View style={styles.rowCenter}>
        <MapPin size={18} color={accentText} strokeWidth={2} />
        <Text style={[type.footnote, { color: c.muted, flex: 1 }]}>{t('room.group.meetingPoint')}</Text>
        {showMenu && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('room.group.menu')} hitSlop={10} onPress={() => setMenu((m) => !m)}>
            <MoreHorizontal size={20} color={c.muted} />
          </Pressable>
        )}
      </View>
      <Text style={[display(24, 30), { color: c.text }]}>
        {t('room.group.meetAt', { place: g.group.meetPlace, time: g.group.meetTime })}
      </Text>
      <View style={styles.rowCenter}>
        {people.length > 0 && <AvatarStack people={people.slice(0, 5)} size={24} />}
        <Text style={[type.subhead, { color: c.muted, flex: 1 }]}>
          {t('room.group.confirmed', { count: g.confirmedCount, total: g.total })}
        </Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: g.meConfirmed }}
          onPress={g.toggleMeet}
          style={({ pressed }) => [
            styles.meetPill,
            g.meConfirmed ? { backgroundColor: c.accent } : { borderWidth: 1.5, borderColor: c.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[onest('semibold', 13), { color: g.meConfirmed ? c.onAccent : accentText }]}>{t('room.group.imThere')}</Text>
          {g.meConfirmed && <Check size={14} color={c.onAccent} strokeWidth={2.6} />}
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
  const { state, dispatch } = useStore();
  const decided = decisionOf(state, event.id, user.id) === 'go';
  const matched = isMatch(state, event.id, user.id);
  const wave = () => {
    if (matched) {
      router.push({ pathname: '/chat/[eventId]/[userId]', params: { eventId: event.id, userId: user.id } });
      return;
    }
    dispatch({ type: 'decide', eventId: event.id, userId: user.id, choice: 'go' });
    if (attendanceOf(event.id, user.id)?.likesYou) {
      router.push({ pathname: '/match/[eventId]/[userId]', params: { eventId: event.id, userId: user.id } });
    }
  };
  return (
    <View style={styles.member}>
      <Avatar name={user.name} gradient={user.gradient} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyStrong, { color: c.text }]}>{user.name}</Text>
        <Text style={[type.footnote, { color: confirmed ? accentText : c.muted }]} numberOfLines={1}>
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
        <Text style={{ fontSize: 18 }}>{matched ? '💬' : '👋'}</Text>
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
    <View style={[styles.panel, { borderLeftColor: c.line }]}>
      <Text style={[display(20, 26), { color: c.text }]}>{t('room.group.members', { count: g.total })}</Text>
      <View style={{ gap: 4 }}>
        {me && (
          <View style={styles.member}>
            <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyStrong, { color: c.text }]}>{t('room.group.you', { name: me.name })}</Text>
              <Text style={[type.footnote, { color: g.meConfirmed ? accentText : c.muted }]} numberOfLines={1}>
                {[me.affiliation, g.meConfirmed ? t('room.group.meConfirmed') : t('room.group.meNotYet')].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        )}
        {g.members.map((u) => (
          <MemberRow key={u.id} event={event} user={u} confirmed={!!g.group?.confirmed.includes(u.id)} />
        ))}
      </View>
      <View style={[styles.rules, { backgroundColor: c.surface }]}>
        <Text style={[type.bodyStrong, { color: c.text }]}>{t('room.group.howItWorks')}</Text>
        {rules.map((r) => (
          <View key={r} style={styles.rowCenter}>
            <Check size={16} color={accentText} strokeWidth={2.6} />
            <Text style={[type.subhead, { color: c.muted, flex: 1 }]}>{r}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Pressable onPress={g.leave} style={({ pressed }) => [styles.leave, { borderColor: c.line }, pressed && { opacity: 0.8 }]}>
        <Text style={[type.callout, { color: c.text }]}>{t('room.group.leave')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meet: { borderWidth: 1.5, borderRadius: 20, padding: 16, gap: 10 },
  meetPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  menu: { borderTopWidth: 1, marginTop: 4, paddingTop: 4 },
  menuItem: { paddingVertical: 10 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  gateBtn: { alignSelf: 'stretch', marginTop: 8 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  waveBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  panel: { width: 400, borderLeftWidth: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, gap: 20 },
  rules: { borderRadius: 20, padding: 16, gap: 10 },
  leave: { height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
