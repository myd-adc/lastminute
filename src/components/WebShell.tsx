import type { ReactNode } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getScene, scenes } from '@/data/mock';
import { myEvents } from '@/lib/selectors';
import { useAppStore } from '@/store/AppStore';
import { colors, type } from '@/theme';

import { MeAvatar } from './Avatar';
import { tabs, type TabKey } from './GlassTabBar';
import { Icon } from './Icon';

// "v3 · Web" chrome: top bar + left sidebar around the routed content.
export function WebShell({ active, children }: { active: TabKey; children: ReactNode }) {
  const { state, dispatch } = useAppStore();
  const allMine = myEvents(state, false);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Link href="/" style={type.webH3}>
          LastMinute
        </Link>
        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.label3} />
          <TextInput
            value={state.search}
            onChangeText={(search) => {
              dispatch({ type: 'setSearch', search });
              if (active !== 'events') router.navigate('/');
            }}
            placeholder="Пошук події або сцени"
            placeholderTextColor={colors.label3}
            style={[type.webBody, styles.searchInput]}
          />
        </View>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.me} onPress={() => router.navigate('/profile')}>
          {state.me && <Text style={[type.webNav, { color: colors.label2 }]}>{state.me.name}</Text>}
          <MeAvatar name={state.me?.name} size={34} fontSize={13} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <View style={{ gap: 2 }}>
            {tabs.map((t) => {
              const on = t.key === active;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => router.navigate(t.href)}
                  style={[styles.navItem, on && { backgroundColor: colors.tintSoft }]}
                >
                  <Icon name={t.icon} size={19} color={on ? colors.tint : colors.label} />
                  <Text style={[type.webBodyMedium, { color: on ? colors.tint : colors.label }]}>{t.webLabel}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={[type.webEyebrow, { color: colors.label3 }]}>ТВОЇ СЦЕНИ</Text>
            {scenes.filter((sc) => state.myScenes.includes(sc.id)).map(({ id }) => {
              const on = state.sceneFilter === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    dispatch({ type: 'setSceneFilter', filter: on ? 'all' : id });
                    router.navigate('/');
                  }}
                  style={[styles.scene, on && { backgroundColor: colors.fill }]}
                >
                  <Text style={type.webBody}>{getScene(id).name}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[type.webCaption, { color: colors.label3 }]}>
                    {allMine.filter((e) => e.sceneId === id).length}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.note}>
            <Text style={[type.webCaptionMedium, { color: colors.label }]}>Одна сцена за раз</Text>
            <Text style={[type.webCaption, { color: colors.label2 }]}>
              Ми не відкриваємо ціле місто: щільність працює лише всередині сцени.
            </Text>
          </View>
        </View>

        <View style={styles.main}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.grouped },
  topBar: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  search: {
    width: 320,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: 20,
    backgroundColor: colors.fill,
  },
  searchInput: { flex: 1, color: colors.label, outlineStyle: 'none' } as object,
  me: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 260,
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 26,
    borderRightWidth: 1,
    borderRightColor: colors.separator,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scene: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  note: { backgroundColor: colors.fill, borderRadius: 14, padding: 14, gap: 6 },
  main: { flex: 1 },
});
