import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { footerBottom } from '@/lib/layout';
import { byGender, shortTitle, venueIn, writeTo } from '@/components/room/text';
import { Avatar, Button, goBack } from '@/components/ui';
import { getEvent, getUser } from '@/data/mock';
import { useT } from '@/i18n';
import { isMatch } from '@/lib/selectors';
import { time } from '@/lib/time';
import { dmChatId, useStore } from '@/store/AppStore';
import { display, onest, type, useTheme } from '@/theme';

const AVATAR = 150;

// M11 «Ви йдете разом» — full-screen celebration after a mutual «Піти разом».
export default function MatchScreen() {
  const { eventId, userId } = useLocalSearchParams<{ eventId: string; userId: string }>();
  const { c, scheme } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { state, sendMessage } = useStore();
  const event = eventId ? getEvent(eventId) : undefined;
  const user = userId ? getUser(userId) : undefined;
  const lightMode = scheme === 'light';

  const background = (
    <>
      <LinearGradient
        colors={lightMode ? ['#CBBEFF', '#F3C6DD', c.bg] : ['#7C5CFF', '#4A2C7A', c.bg]}
        locations={[0, 0.45, 0.85]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, { top: 90, left: -120, backgroundColor: lightMode ? 'rgba(61,217,255,0.22)' : 'rgba(61,217,255,0.18)' }]} />
      <View style={[styles.blob, { top: 260, right: -140, backgroundColor: lightMode ? 'rgba(255,61,139,0.16)' : 'rgba(255,61,139,0.2)' }]} />
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
  const textColor = lightMode ? c.text : '#F6F5F2';
  const subColor = lightMode ? 'rgba(11,11,16,0.7)' : 'rgba(246,245,242,0.78)';

  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      {background}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: footerBottom(insets.bottom) }]}
        bounces={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatars}>
            <View style={[styles.ring, { borderColor: c.bg }]}>
              <Avatar name={me.name} gradient={me.gradient} photoUri={me.photoUri} size={AVATAR} />
            </View>
            <View style={[styles.ring, { borderColor: c.bg, marginLeft: -22 }]}>
              <Avatar name={user.name} gradient={user.gradient} size={AVATAR} />
            </View>
            <Text style={styles.wave}>👋</Text>
          </View>

          <Text style={[display(30, 38), { color: textColor, textAlign: 'center' }]}>{t('room.match.title')}</Text>
          <Text style={[onest('regular', 15, 21), { color: subColor, textAlign: 'center' }]}>
            {t('room.match.body', { name: user.name, event: shortTitle(event), venueIn: venueIn(event.venue) })}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: lightMode ? 'rgba(255,255,255,0.8)' : 'rgba(22,22,29,0.78)', borderColor: lightMode ? c.line : 'rgba(255,255,255,0.08)' },
          ]}
        >
          <Text style={[type.caption, { color: c.muted }]}>{t('room.match.startSimple')}</Text>
          {suggestions.map((s) => (
            <Pressable
              key={s.text}
              accessibilityRole="button"
              onPress={() => {
                sendMessage(chatId, s.text);
                openChat();
              }}
              style={({ pressed }) => [styles.chip, { backgroundColor: c.surface2, borderColor: c.line }, pressed && { opacity: 0.8 }]}
            >
              <Text style={[onest('medium', 15), { color: c.text }]} numberOfLines={1}>
                {s.icon} {s.text}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.flex} />

        <View style={styles.buttons}>
          <Button label={writeTo(user.name)} onPress={openChat} />
          <Button label={t('room.match.later')} variant="ghost" onPress={() => goBack()} style={lightMode ? undefined : { borderColor: 'rgba(255,255,255,0.22)' }} />
          <View style={styles.note}>
            <Clock size={14} color={c.muted} strokeWidth={2} />
            <Text style={[type.footnote, { color: c.muted }]}>{t('room.match.chatLives')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute', width: 360, height: 360, borderRadius: 180 },
  content: { flexGrow: 1, paddingHorizontal: 20, gap: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  ring: { borderWidth: 4, borderRadius: AVATAR / 2 + 4 },
  wave: { position: 'absolute', bottom: -18, alignSelf: 'center', left: 0, right: 0, textAlign: 'center', fontSize: 44 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  chip: { alignSelf: 'flex-start', maxWidth: '100%', height: 40, borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1 },
  buttons: { gap: 12 },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
});
