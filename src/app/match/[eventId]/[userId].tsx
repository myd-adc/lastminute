import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { byGender, shortTitle, venueIn, writeTo } from '@/components/room/text';
import { Face } from '@/components/room/Face';
import { Glow } from '@/components/room/Glow';
import { Button, Chip, goBack } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { getEvent, getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { isMatch } from '@/lib/selectors';
import { time } from '@/lib/time';
import { dmChatId, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

// Figma M11 (390×844): faces 136 pt (5 pt ring, ±6° tilt) at y 150 · 👋 44 pt · copy 50 below · icebreakers 34 below ·
// buttons 56+10+56 · note 8 below, 33 pt above the screen bottom.
const FACE = 136;
const FACE_BOX = 149.5; // bounding box of the tilted face
const STATUS_BAR = 50; // Figma frame status bar; on device the safe-area inset replaces it

// M11 "Going together" — full-screen celebration after a mutual "Go together".
export default function MatchScreen() {
  const { eventId, userId } = useLocalSearchParams<{ eventId: string; userId: string }>();
  const { c, scheme } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { state, sendMessage } = useStore();
  const event = eventId ? getEvent(eventId) : undefined;
  const user = userId ? getUser(userId) : undefined;
  const lightMode = scheme === 'light';
  // Content is capped at 480 pt on wide screens; the art follows the centred column.
  const col = Math.min(width, 480);
  const left = (width - col) / 2;
  const dy = insets.top - STATUS_BAR;

  // Gradient art (Figma «bg» + two blurred «glow» discs).
  const background = (
    <>
      <LinearGradient
        colors={lightMode ? ['#7C5CFF', '#DEDBDF', '#DAD9D6'] : ['#7C5CFF', '#2A1A5E', '#0B0B10']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Glow cx={left + 70} cy={250 + dy} r={130} blur={45} color="#D7FF3B" opacity={0.35} />
      <Glow cx={left + col - 70} cy={340 + dy} r={120} blur={45} color={lightMode ? '#E3246C' : '#FF3D8B'} opacity={0.5} />
    </>
  );

  if (!event || !user || !isMatch(state, event.id, user.id)) {
    return (
      <View style={[styles.flex, styles.centerAll, { backgroundColor: c.bg, padding: 24, gap: 16 }]}>
        {background}
        <Text style={[type.title2, { color: c.text, textAlign: 'center' }]}>{t('room.match.noMatch')}</Text>
        <Text style={[type.body, { color: c.muted, textAlign: 'center' }]}>
          {t('room.match.noMatchBody')}
        </Text>
        <Button label={t('common.back')} variant="secondary" onPress={() => goBack()} style={{ alignSelf: 'stretch', maxWidth: 420, width: '100%' }} />
      </View>
    );
  }

  const me = state.me ?? { name: t('room.match.me'), gradient: 'lime' as const, photoUri: undefined };
  const chatId = dmChatId(event.id, user.id);
  const openChat = () => router.replace({ pathname: '/chat/[eventId]/[userId]', params: { eventId: event.id, userId: user.id } });
  const meetAt = time(new Date(Date.parse(event.startsAt) - 15 * 60000).toISOString());
  const suggestions = [
    { icon: '📍', text: t('room.match.meetAt', { time: meetAt }) },
    { icon: '🎤', text: t(byGender(user, 'room.match.beenF', 'room.match.beenM'), { venueIn: venueIn(event.venue), venue: event.venue }) },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      {background}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 100, paddingBottom: Math.max(insets.bottom, 34) - 1 }]}
        bounces={false}
      >
        <View style={styles.faces}>
          <View style={[styles.faceBox, { marginRight: -28 }]}>
            <Face name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={FACE} fontSize={49} font="display" borderWidth={5} borderColor={c.bg} style={{ transform: [{ rotate: '6deg' }] }} />
          </View>
          <View style={styles.faceBox}>
            <Face name={user.name} gradient={user.gradient} photoUri={user.photoUri} size={FACE} fontSize={49} font="display" borderWidth={5} borderColor={c.bg} style={{ transform: [{ rotate: '-6deg' }] }} />
          </View>
          <Text style={styles.wave}>👋</Text>
        </View>

        <View style={styles.copy}>
          <Text style={[display(32, 35), { color: c.text, textAlign: 'center' }]}>{t('room.match.title')}</Text>
          <Text style={[onest('regular', 16, 22), { color: c.text, textAlign: 'center' }]}>
            {t('room.match.body', { name: user.name, event: shortTitle(event), venueIn: venueIn(event.venue) })}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Text style={[onest('semibold', 13, 17), { color: c.muted }]}>{t('room.match.startSimple')}</Text>
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Chip
                key={s.text}
                label={`${s.icon} ${s.text}`}
                onPress={() => {
                  sendMessage(chatId, s.text);
                  openChat();
                }}
              />
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttons}>
          <Button label={writeTo(user.name)} onPress={openChat} />
          <Button label={t('room.match.later')} variant="ghost" onPress={() => goBack()} />
        </View>
        <View style={styles.note}>
          <Clock size={14} color={c.muted} strokeWidth={2} />
          <Text style={[onest('regular', 13, 17), { color: c.muted }]}>{t('room.match.chatLives')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  faces: { flexDirection: 'row', justifyContent: 'center' },
  faceBox: { width: FACE_BOX, height: FACE_BOX, alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', top: 118, left: 0, right: 0, textAlign: 'center', fontSize: 44, lineHeight: 56 },
  copy: { marginTop: 50, gap: 12 },
  card: { marginTop: 34, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  spacer: { flexGrow: 1, minHeight: 40 },
  buttons: { gap: 10 },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
});
