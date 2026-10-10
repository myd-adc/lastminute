import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { instrumental, pronouns } from '@/components/profile/names';
import { Avatar, Button, Checkbox, goBack, Radio, Sheet } from '@/components/ui';
import { getUser } from '@/data/mock';
import type { ReportReason } from '@/data/types';
import { useT } from '@/i18n';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';

const reasons: ReportReason[] = ['messages', 'dating', 'fake', 'unsafe', 'other'];

// M17 «Скарга»: anonymous report with an optional block, as a bottom sheet over the chat.
export default function ReportScreen() {
  const { c } = useTheme();
  const { t, lang } = useT();
  const { dispatch } = useStore();
  const now = useNow();
  const { userId, eventId } = useLocalSearchParams<{ userId: string; eventId?: string }>();
  const user = getUser(userId);
  const [reason, setReason] = useState<ReportReason>('messages');
  const [other, setOther] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [sent, setSent] = useState<null | { blocked: boolean }>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const p = pronouns(user, lang);
  const name = instrumental(user?.name, lang);
  const number = t('profile.emergencyNumber');

  const submit = () => {
    if (!user) return;
    dispatch({ type: 'report', report: { userId: user.id, eventId, reason, alsoBlock, at: new Date(now).toISOString() } });
    setSent({ blocked: alsoBlock });
    timer.current = setTimeout(() => {
      if (alsoBlock) {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/chats');
      } else goBack('/chats');
    }, 1400);
  };

  if (!user) {
    return (
      <Sheet footer={<Button label={t('common.close')} variant="secondary" onPress={() => goBack('/chats')} />}>
        <Text style={[type.headline, { color: c.text }]}>{t('profile.report.notFound')}</Text>
      </Sheet>
    );
  }

  if (sent) {
    return (
      <Sheet onClose={() => {}}>
        <View style={styles.thanks}>
          <Text style={{ fontSize: 44 }}>🙏</Text>
          <Text style={[type.title2, { color: c.text, textAlign: 'center' }]}>{t('profile.report.thanks')}</Text>
          <Text style={[type.subhead, { color: c.muted, textAlign: 'center' }]}>
            {sent.blocked ? t('profile.report.blockedNote', { name: user.name }) : t('profile.report.anonNote')}
          </Text>
        </View>
      </Sheet>
    );
  }

  const canSend = reason !== 'other' || other.trim().length > 0;

  return (
    <Sheet footer={<Button label={t('profile.report.send')} onPress={submit} disabled={!canSend} style={{ height: 60, borderRadius: 30 }} />}>
      <View style={styles.head}>
        <Avatar name={user.name} gradient={user.gradient} size={44} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[onest('bold', 18, 23), { color: c.text }]}>{t('profile.report.title', { name })}</Text>
          <Text style={[type.footnote, { color: c.muted }]}>{t('profile.report.anon', p)}</Text>
        </View>
      </View>

      <View style={[styles.list, { backgroundColor: c.surface2 }]}>
        {reasons.map((r, i) => {
          const on = reason === r;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setReason(r)}
              style={[styles.reason, i < reasons.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.line }]}
            >
              <Text style={[onest('medium', 15), { color: c.text, flex: 1 }]}>{t(`profile.report.reasons.${r}`)}</Text>
              <Radio selected={on} />
            </Pressable>
          );
        })}
        {reason === 'other' && (
          <TextInput
            value={other}
            onChangeText={setOther}
            placeholder={t('profile.report.otherPlaceholder')}
            placeholderTextColor={c.muted}
            multiline
            maxLength={300}
            autoFocus
            style={[styles.input, onest('regular', 15), { color: c.text, backgroundColor: c.surface, borderColor: c.line }]}
          />
        )}
      </View>

      <View style={[styles.block, { borderColor: c.line }]}>
        <Checkbox
          checked={alsoBlock}
          onChange={setAlsoBlock}
          label={t('profile.report.alsoBlock')}
          sub={t('profile.report.alsoBlockSub', p)}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('profile.report.callA11y', { number })}
        onPress={() => Linking.openURL(`tel:${number}`)}
        style={({ pressed }) => [styles.danger, { backgroundColor: c.dangerSoft }, pressed && { opacity: 0.85 }]}
      >
        <Text style={{ fontSize: 16 }}>🚨</Text>
        <Text style={[type.footnote, { color: c.text, flex: 1 }]}>{t('profile.report.danger', { number })}</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  list: { borderRadius: 16, overflow: 'hidden' },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16 },
  input: { margin: 12, marginTop: 0, minHeight: 72, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top' },
  block: { borderWidth: 1, borderRadius: 16, padding: 14 },
  danger: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14 },
  thanks: { alignItems: 'center', gap: 10, paddingVertical: 28 },
});
