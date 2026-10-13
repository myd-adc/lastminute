import { Bookmark, Send, Users, X } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AvatarStack, Button, IconButton, Pill } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { Event } from '@/data/types';
import { useT } from '@/i18n';
import { going as goingLabel } from '@/lib/time';
import { display, onest, useStyles, type Palette, type GradientId, type Scheme } from '@/theme';

import { priceLabel } from './format';
import { PosterArt } from './PosterArt';
import { RailButton } from './RailButton';

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
  shift: number; // insets.top - 50: the safe area replaces the 50 pt Figma status bar
  bottomClearance: number;
  when: string;
  saved: boolean;
  goingN: number;
  soloN: number;
  metN: number; // people the user met before among those going (count only)
  preview: PeoplePreview;
};

// Translucent venue/price pills over the poster (M06/W03: text colour at 16 %).
export const posterPillBg = (scheme: Scheme) => (scheme === 'light' ? 'rgba(11,11,16,0.16)' : 'rgba(246,245,242,0.16)');

// One full-screen page of the M06 swipe feed. Memoised: only re-renders when its own data changes.
// Everything below the poster is bottom-anchored above the tab bar, as in the frame (actions end 16 pt above the bar).
export const FeedPage = memo(function FeedPage(p: Props) {
  const { event: e } = p;
  const s = useStyles(makeStyles);
  const { t } = useT();
  const extra = Math.max(0, p.goingN - p.preview.people.length);
  const open = () => p.onOpen(e.id);
  return (
    <View style={{ width: p.width, height: p.height }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('feed.openDetails', { title: e.title })} onPress={open} style={StyleSheet.absoluteFill}>
        <PosterArt event={e} width={p.width} height={p.height} variant="feed" shift={p.shift} />
      </Pressable>

      <View style={[styles.content, { paddingBottom: p.bottomClearance }]}>
        <View style={styles.mid}>
          <View style={styles.info}>
            <Pressable onPress={open} style={styles.infoTop}>
              <View style={styles.pills}>
                <Pill label={p.when} tone="accent" />
                <Pill label={e.venue} tone="surface2" weight="medium" style={s.glassPill} />
                <Pill label={priceLabel(e)} tone="surface2" weight="medium" style={s.glassPill} />
              </View>
              <Text style={[display(28, 31), s.text]} numberOfLines={3}>
                {e.title}
              </Text>
            </Pressable>
            <Pressable onPress={open} style={s.who}>
              <AvatarStack people={p.preview.people} size={36} extra={extra} />
              <View style={styles.whoText}>
                <Text style={[onest('bold', 15, 19), s.text]}>{t('feed.card.going', { count: p.goingN })}</Text>
                {p.metN > 0 ? (
                  <Text style={[onest('medium', 13, 17), s.accent]}>{t('feed.card.met', { count: p.metN })}</Text>
                ) : (
                  p.soloN > 0 && <Text style={[onest('medium', 13, 17), s.accent]}>{t('feed.card.soloHint', { count: p.soloN })}</Text>
                )}
              </View>
            </Pressable>
          </View>
          <View style={styles.rail}>
            <RailButton tone="poster" icon={Bookmark} active={p.saved} label={p.saved ? t('common.saved') : t('common.save')} onPress={() => p.onSave(e.id)} />
            <RailButton tone="poster" icon={Send} label={t('feed.share')} onPress={() => p.onShare(e)} />
            <RailButton tone="poster" icon={Users} label={String(p.goingN)} accessibilityLabel={goingLabel(p.goingN)} onPress={open} />
          </View>
        </View>

        <View style={styles.actions}>
          <IconButton icon={X} size={56} accessibilityLabel={t('common.skip')} onPress={() => p.onSkip(e.id)} />
          <Button label={t('common.imGoing')} onPress={() => p.onGo(e.id)} style={styles.go} />
        </View>
      </View>
    </View>
  );
});

const makeStyles = (c: Palette, scheme: Scheme) =>
  StyleSheet.create({
    text: { color: c.text },
    accent: { color: c.accentInk },
    glassPill: { backgroundColor: posterPillBg(scheme) },
    who: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: 12,
      paddingRight: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
  });

const styles = StyleSheet.create({
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, gap: 18, pointerEvents: 'box-none' },
  // Info column (292 pt) + 52 pt rail at x = 318; the rail ends 57 pt above the info block.
  mid: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  info: { flex: 1, gap: 12 },
  infoTop: { gap: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  whoText: { flex: 1, gap: 2 },
  rail: { width: 52, alignItems: 'center', gap: 18, marginBottom: 57 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  go: { flex: 1 },
});
