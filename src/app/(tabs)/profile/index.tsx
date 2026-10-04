import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Group, GroupLabel, Row } from '@/components/Group';
import { Icon } from '@/components/Icon';
import { LargeTitle, Screen } from '@/components/Screen';
import { getScene } from '@/data/mock';
import { useIsWide } from '@/lib/hooks';
import { useAppStore } from '@/store/AppStore';
import { avatarColors, colors, type } from '@/theme';

export default function ProfileScreen() {
  const { state, dispatch } = useAppStore();
  const wide = useIsWide();
  const me = state.me;
  const blockedCount = Object.keys(state.blocked).length;
  const domain = state.verifiedEmail?.split('@')[1];

  return (
    <Screen contentStyle={wide && { maxWidth: 720 + 96 }}>
      <LargeTitle title="Профіль" />

      {me ? (
        <Pressable style={styles.me} onPress={() => router.push('/profile/edit')}>
          <View style={styles.who}>
            <Avatar name={me.name} color={avatarColors[4]} size={64} fontSize={26} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.title3}>{me.name}</Text>
              <Text style={[type.subhead, { color: colors.label2 }]}>{me.affiliation || 'Додай групу й факультет'}</Text>
            </View>
          </View>
          <View style={styles.quote}>
            <Text style={[type.callout, !me.bio && { color: colors.label3 }]}>
              {me.bio || 'Пару слів про себе: що любиш і з ким хочеш поговорити на події.'}
            </Text>
          </View>
          {me.tags.length > 0 && <Text style={[type.footnote, { color: colors.label3 }]}>{me.tags.join(' · ')}</Text>}
        </Pressable>
      ) : (
        <View style={[styles.me, { alignItems: 'stretch' }]}>
          <Text style={type.headline}>Ти ще не створив(-ла) профіль</Text>
          <Text style={[type.subhead, { color: colors.label2 }]}>
            Це займе кілька секунд: імʼя — і все. Решту можна додати пізніше.
          </Text>
          <Button title="Створити профіль" onPress={() => router.push('/join')} />
        </View>
      )}

      <Pressable
        style={styles.verified}
        disabled={!!state.verifiedEmail}
        onPress={() => router.push('/verify')}
      >
        <Icon name="dot" size={22} color={state.verifiedEmail ? colors.green : colors.label3} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.subheadMedium}>{domain ? `Підтверджено: @${domain}` : 'Пошту не підтверджено'}</Text>
          <Text style={[type.footnote, { color: colors.label2 }]}>
            {domain ? 'Вхід лише за студентською поштою' : 'Потрібно, щоб знайомитись. Займе хвилину.'}
          </Text>
        </View>
        {!domain && <Icon name="chevron" size={16} color={colors.label3} />}
      </Pressable>

      <GroupLabel>Видимість і безпека</GroupLabel>
      <Group>
        <Row
          label="Показувати мене на подіях"
          value={state.visible ? 'Увімк.' : 'Вимк.'}
          valueColor={state.visible ? colors.green : colors.label2}
          chevron
          onPress={() => dispatch({ type: 'setVisible', visible: !state.visible })}
        />
        <Row
          label="Мої сцени"
          value={state.myScenes.map((id) => getScene(id).name).join(', ')}
          chevron
          onPress={() => router.push('/profile/scenes')}
        />
        <Row label="Заблоковані" value={String(blockedCount)} chevron last onPress={() => router.push('/profile/blocked')} />
      </Group>
      <Text style={[type.footnote, { color: colors.label2 }]}>
        Нема точної геолокації, нема повідомлень без взаємної згоди, нема знайомств без верифікації.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  me: { backgroundColor: colors.elevated, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 18, gap: 14 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  quote: { backgroundColor: colors.fill, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.elevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
