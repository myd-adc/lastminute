import { Bookmark, Send, Users, X } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarStack, Button, IconButton, Pill } from '@/components/ui';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { going as goingLabel } from '@/lib/time';
import { display, onest, useTheme, type GradientId } from '@/theme';

import { priceLabel } from './format';
import { PosterArt } from './PosterArt';

export type PeoplePreview = { people: { name: string; gradient: GradientId }[] };

export type FeedHandlers = {
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (e: Event) => void;
  onSkip: (id: string) => void;
  onGo: (id: string) => void;
};

type Props = FeedHandlers & {
  event: Event;
  width: number;
  height: number;
  posterTop: number;
  bottomClearance: number;
  when: string;
  saved: boolean;
  goingN: number;
  soloN: number;
  scene: string;
  preview: PeoplePreview;
};

const WHITE = '#F6F5F2';

// One full-screen page of the M06 swipe feed. Memoised: only re-renders when its own data changes.
export const FeedPage = memo(function FeedPage(p: Props) {
  const { event: e } = p;
  const { c, scheme } = useTheme();
  const { t } = useT();
  const light = scheme === 'light';
  const fg = light ? c.text : WHITE;
  const extra = Math.max(0, p.goingN - p.preview.people.length);
  const open = () => p.onOpen(e.id);
  return (
    <View style={{ width: p.width, height: p.height }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('feed.openDetails', { title: e.title })} onPress={open} style={StyleSheet.absoluteFill}>
        <PosterArt event={e} width={p.width} height={p.height} top={p.posterTop} scrimFrom={0.38} />
      </Pressable>

      <View style={[styles.content, { paddingBottom: p.bottomClearance }]}>
        <View style={styles.mid}>
          <Pressable onPress={open} style={styles.info}>
            <View style={styles.pills}>
              <Pill label={p.when} tone="accent" />
              <Pill label={e.venue} tone="glass" />
              <Pill label={priceLabel(e)} tone="glass" />
            </View>
            <Text style={[display(30, 34), { color: fg }]} numberOfLines={3}>
              {e.title}
            </Text>
          </Pressable>
          <View style={styles.rail}>
            <IconButton icon={Bookmark} size={44} variant={light ? 'surface' : 'glass'} active={p.saved} label={p.saved ? t('common.saved') : t('common.save')} onPress={() => p.onSave(e.id)} />
            <IconButton icon={Send} size={44} variant={light ? 'surface' : 'glass'} label={t('feed.share')} onPress={() => p.onShare(e)} />
            <IconButton icon={Users} size={44} variant={light ? 'surface' : 'glass'} label={String(p.goingN)} accessibilityLabel={goingLabel(p.goingN)} onPress={open} />
          </View>
        </View>

        <Pressable onPress={open} style={[styles.who, light && styles.whoLight]}>
          <AvatarStack people={p.preview.people} size={30} extra={extra} />
          <View style={styles.flex}>
            <Text style={[onest('bold', 14, 18), { color: fg }]}>
              {t('feed.card.goingFrom', { count: p.goingN, scene: p.scene })}
            </Text>
            {p.soloN > 0 && (
              <Text style={[onest('medium', 13, 17), { color: light ? '#5A7A00' : c.accent }]}>
                {t('feed.card.soloHint', { count: p.soloN })}
              </Text>
            )}
          </View>
        </Pressable>

        <View style={styles.actions}>
          <IconButton icon={X} size={60} variant={light ? 'surface' : 'glass'} accessibilityLabel={t('common.skip')} onPress={() => p.onSkip(e.id)} />
          <Button label={t('common.imGoing')} onPress={() => p.onGo(e.id)} style={styles.go} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, gap: 14, pointerEvents: 'box-none' },
  mid: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  info: { flex: 1, gap: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rail: { width: 64, alignItems: 'center', gap: 14, paddingBottom: 2 },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginRight: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(11,11,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  whoLight: { backgroundColor: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.9)' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  go: { flex: 1, height: 60, borderRadius: 30 },
});
