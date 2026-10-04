import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getScene } from '@/data/mock';
import type { Event } from '@/data/types';
import { dayOfMonth, goingLabel, time, weekdayShort } from '@/lib/format';
import type { Attendee } from '@/lib/selectors';
import { colors, type } from '@/theme';

import { AvatarStack } from './Avatar';
import { Icon } from './Icon';

type Props = {
  event: Event;
  attendees: Attendee[];
  fromMyScene: number;
  going: boolean;
  wide?: boolean;
};

export function EventCard({ event, attendees, fromMyScene, going, wide }: Props) {
  const total = event.goingCount + (going ? 1 : 0);
  const sub = wide
    ? `${event.venue} · ${time(event.startsAt)} · ${getScene(event.sceneId).name}`
    : `${event.venue} · ${time(event.startsAt)}`;
  const stack = attendees.slice(0, wide ? 4 : 3).map((a) => a.user);

  return (
    <Link href={{ pathname: '/event/[id]', params: { id: event.id } }} asChild>
      <Pressable style={wide ? styles.cardWide : styles.card}>
        <View style={[styles.top, wide && { gap: 16 }]}>
          <View style={[styles.date, wide && styles.dateWide]}>
            <Text style={[wide ? type.webCaption : type.caption, styles.dateText]}>{weekdayShort(event.startsAt)}</Text>
            <Text style={[wide ? type.webNumeral : type.dateNumeral, styles.dateText]}>{dayOfMonth(event.startsAt)}</Text>
          </View>
          <View style={[styles.text, wide && { gap: 4 }]}>
            <Text style={wide ? type.webH3 : type.headline}>{event.title}</Text>
            <Text style={[wide ? type.webBody : type.subhead, styles.muted]}>{sub}</Text>
          </View>
          <Icon name="chevron" size={20} color={colors.label3} />
        </View>
        <View style={[styles.going, wide && { gap: 12 }]}>
          {stack.length > 0 && <AvatarStack people={stack} size={wide ? 28 : 26} />}
          <Text style={[wide ? type.webCaption : type.footnote, styles.muted]}>
            {going ? `Ти йдеш · ${goingLabel(total)}` : goingLabel(total)} · {fromMyScene} з твоєї сцени
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  cardWide: {
    backgroundColor: colors.elevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.separator,
    padding: 20,
    gap: 16,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: {
    width: 52,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.tintSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateWide: { width: 60, height: 64 },
  dateText: { color: colors.tint },
  text: { flex: 1, gap: 3 },
  muted: { color: colors.label2 },
  going: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
