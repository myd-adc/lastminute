import { useCallback, useEffect, useImperativeHandle, useMemo, useState, type Ref } from 'react';
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useT } from '@/i18n';
import type { Attendee } from '@/lib/selectors';
import { onest, useTheme } from '@/theme';

import { CardShadowSheet, PersonCard } from './PersonCard';

export type Choice = 'go' | 'skip';
export type DeckHandle = { swipe: (choice: Choice) => void };

type Props = {
  people: Attendee[]; // pending queue, first = top card
  onDecide: (attendee: Attendee, choice: Choice) => void;
  onMore: (attendee: Attendee) => void;
  showShared: boolean;
  keyboard?: boolean; // web: ← skip, → go, Space toggles the profile details
  maxWidth?: number;
  maxHeight?: number;
  ref?: Ref<DeckHandle>;
};

const ND = Platform.OS !== 'web'; // native driver for transforms on iOS/Android
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 0.7;
const BASE_TILT = 1.5;
const PEEK = 12;
// Pan values whose card is already flying out (guards double swipes/taps).
const flying = new WeakSet<Animated.ValueXY>();

// Stack of tilted person cards (M09/W05). Drag the top card left/right; the next card scales up underneath.
export function CardDeck({ people, onDecide, onMore, showShared, keyboard, maxWidth = 350, maxHeight = 500, ref }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const top = people[0];
  const next = people[1];
  const third = people[2];
  const topId = top?.user.id;

  // A fresh value per top card: the leaving card keeps its own until it unmounts, so nothing has to be reset.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pan = useMemo(() => new Animated.ValueXY({ x: 0, y: 0 }), [topId]);

  const fly = useCallback(
    (choice: Choice) => {
      if (!top || flying.has(pan)) return;
      flying.add(pan);
      const dir = choice === 'go' ? 1 : -1;
      Animated.timing(pan, {
        toValue: { x: dir * (Math.max(box.w, 360) + 320), y: 30 },
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: ND,
      }).start(() => onDecide(top, choice));
    },
    [top, pan, box.w, onDecide],
  );

  useImperativeHandle(ref, () => ({ swipe: fly }), [fly]);

  const responder = useMemo(() => {
    const springBack = () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 60, useNativeDriver: ND }).start();
    const horizontal = (_: unknown, g: { dx: number; dy: number }) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;
    return PanResponder.create({
      onMoveShouldSetPanResponder: horizontal,
      onMoveShouldSetPanResponderCapture: horizontal,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy * 0.25 }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_DISTANCE || (g.vx > SWIPE_VELOCITY && g.dx > 20)) fly('go');
        else if (g.dx < -SWIPE_DISTANCE || (g.vx < -SWIPE_VELOCITY && g.dx < -20)) fly('skip');
        else springBack();
      },
      onPanResponderTerminate: springBack,
    });
  }, [pan, fly]);

  const toggleExpanded = useCallback(() => setExpandedId((id) => (id === topId ? null : (topId ?? null))), [topId]);

  useEffect(() => {
    if (!keyboard || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'ArrowRight') fly('go');
      else if (e.key === 'ArrowLeft') fly('skip');
      else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleExpanded();
      } else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, fly, toggleExpanded]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
  };

  const cardW = Math.min(maxWidth, box.w);
  const cardH = Math.min(maxHeight, box.h - PEEK * 2 - 8);
  const ready = cardW > 200 && cardH > 300;

  const topStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate: pan.x.interpolate({ inputRange: [-300, 0, 300], outputRange: [`${BASE_TILT - 14}deg`, `${BASE_TILT}deg`, `${BASE_TILT + 14}deg`] }) },
    ],
  };
  const progress = pan.x.interpolate({ inputRange: [-SWIPE_DISTANCE, 0, SWIPE_DISTANCE], outputRange: [1, 0, 1], extrapolate: 'clamp' });
  const nextStyle = {
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [PEEK * 2.4, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', `${BASE_TILT}deg`] }) },
    ],
  };
  const goOpacity = pan.x.interpolate({ inputRange: [20, 100], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = pan.x.interpolate({ inputRange: [-100, -20], outputRange: [1, 0], extrapolate: 'clamp' });

  // Rendered back-to-front; cards are keyed by user so the next card becomes the top one without remounting.
  const cards = [next, top].filter((a): a is Attendee => !!a);

  return (
    <View style={styles.flex} onLayout={onLayout}>
      {ready && top && (
        <View style={[styles.stage, { width: cardW, height: cardH }]}>
          {third && (
            <View style={[styles.abs, styles.noTouch, { left: 24, top: PEEK * 2, transform: [{ rotate: '-4deg' }] }]}>
              <CardShadowSheet width={cardW - 48} height={cardH - 10} />
            </View>
          )}
          {cards.map((a) => {
            const isTop = a === top;
            return (
              <Animated.View
                key={a.user.id}
                style={[styles.abs, isTop ? topStyle : [nextStyle, styles.noTouch]]}
                {...(isTop ? responder.panHandlers : null)}
              >
                <PersonCard
                  attendee={a}
                  width={cardW}
                  height={cardH}
                  showShared={showShared}
                  expanded={isTop && expandedId === a.user.id}
                  onPress={isTop ? toggleExpanded : undefined}
                  onMore={isTop ? () => onMore(a) : undefined}
                />
                {isTop && (
                  <>
                    <Animated.View style={[styles.stamp, styles.stampGo, { backgroundColor: c.accent, opacity: goOpacity }]}>
                      <Text style={[onest('bold', 16), { color: c.onAccent }]}>{t('common.goTogether')}</Text>
                    </Animated.View>
                    <Animated.View style={[styles.stamp, styles.stampSkip, { backgroundColor: c.surface2, opacity: skipOpacity }]}>
                      <Text style={[onest('bold', 16), { color: c.text }]}>{t('room.stampSkip')}</Text>
                    </Animated.View>
                  </>
                )}
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: { marginBottom: PEEK * 2 },
  abs: { position: 'absolute', top: 0, left: 0 },
  noTouch: { pointerEvents: 'none' },
  stamp: { position: 'absolute', top: 64, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, pointerEvents: 'none' },
  stampGo: { left: 20, transform: [{ rotate: '-8deg' }] },
  stampSkip: { right: 20, transform: [{ rotate: '8deg' }] },
});
