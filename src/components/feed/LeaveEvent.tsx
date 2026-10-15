import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Sheet } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

import { shortTitle } from './format';

// "I'm not going any more" link, shown next to the details once the user is going.
export function LeaveEventLink({ onPress, label }: { onPress: () => void; label?: string }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <Text style={[onest('semibold', 14, 18), { color: c.muted }]}>{label ?? t('feed.leave.action')}</Text>
    </Pressable>
  );
}

// One-step confirmation for leaving an event. A sheet rather than Alert.alert, which does nothing on web.
// Matches live on the room decisions, not on the attendance, so they and their chats outlive the exit.
export function LeaveEventSheet({ event, visible, onClose }: { event: Event; visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const { state, dispatch } = useStore();
  const going = state.going[event.id];
  const inSoloGroup = going?.with === 'solo' && going.joinSoloGroup;

  const leave = () => {
    dispatch({ type: 'leave', eventId: event.id });
    onClose();
    router.replace('/');
  };

  const line = [onest('regular', 14, 19), { color: c.muted }];
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      footer={(close) => (
        <>
          <Pressable accessibilityRole="button" onPress={leave} style={({ pressed }) => [styles.danger, { backgroundColor: c.danger }, pressed && { opacity: 0.85 }]}>
            <Text style={[onest('bold', 16, 20), styles.dangerLabel]}>{t('feed.leave.confirm')}</Text>
          </Pressable>
          <Button label={t('feed.leave.cancel')} variant="secondary" onPress={close} />
        </>
      )}
    >
      <Text style={[type.title2, { color: c.text }]}>{t('feed.leave.title', { title: shortTitle(event) })}</Text>
      <View style={styles.lines}>
        <Text style={line}>{t('feed.leave.body')}</Text>
        <Text style={line}>{t('feed.leave.keepsChats')}</Text>
        {inSoloGroup && <Text style={line}>{t('feed.leave.losesGroup')}</Text>}
      </View>
    </Sheet>
  );
}

// The author's own exit: the event goes away for everyone, so it asks separately from "I'm not going".
export function CancelEventSheet({ event, visible, onClose }: { event: Event; visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const { dispatch } = useStore();

  const cancel = () => {
    dispatch({ type: 'cancelEvent', eventId: event.id });
    onClose();
    router.replace('/');
  };

  const line = [onest('regular', 14, 19), { color: c.muted }];
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      footer={(close) => (
        <>
          <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => [styles.danger, { backgroundColor: c.danger }, pressed && { opacity: 0.85 }]}>
            <Text style={[onest('bold', 16, 20), styles.dangerLabel]}>{t('feed.own.cancelConfirm')}</Text>
          </Pressable>
          <Button label={t('feed.own.cancelKeep')} variant="secondary" onPress={close} />
        </>
      )}
    >
      <Text style={[type.title2, { color: c.text }]}>{t('feed.own.cancelTitle', { title: shortTitle(event) })}</Text>
      <View style={styles.lines}>
        <Text style={line}>{t('feed.own.cancelBody')}</Text>
        <Text style={line}>{t('feed.own.cancelChats')}</Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  lines: { gap: 8 },
  danger: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  dangerLabel: { color: '#FFFFFF' },
});
