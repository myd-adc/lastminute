import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Gradient } from '@/components/ui';
import type { Event } from '@/data/types';
import { fonts, useTheme } from '@/theme';

type Props = {
  event: Event;
  width: number;
  height: number;
  // Where the bottom scrim starts (0…1 of the height). Content sits on the dark part.
  scrimFrom?: number;
  top?: number; // offset of the first poster word (clears the feed tabs on phones)
};

// Generated event poster (M06/W03): gradient, huge Unbounded words bleeding off the edges,
// a thin accent ring and an oversized emoji, with a scrim at the bottom for legibility
// (dark theme: dark scrim + black words; light theme: light scrim + white words, per W03 light).
export const PosterArt = memo(function PosterArt({ event, width, height, scrimFrom = 0.42, top }: Props) {
  const { c, scheme } = useTheme();
  const light = scheme === 'light';
  const size = Math.round(width * 0.27);
  const ring = Math.round(width * 0.98);
  const wordsTop = top ?? Math.round(height * 0.1);
  return (
    <View style={[styles.clip, { width, height }]}>
      <Gradient id={event.poster.gradient} style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.ring,
          { width: ring, height: ring, borderRadius: ring / 2, left: width * 0.33, top: wordsTop - ring * 0.32, borderColor: c.accent },
        ]}
      />
      <View style={{ position: 'absolute', top: wordsTop, left: -Math.round(size * 0.06) }}>
        {event.poster.lines.map((line, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={[
              styles.word,
              light && { color: '#FFFFFF' },
              { fontSize: size, lineHeight: Math.round(size * 0.98), letterSpacing: -size * 0.045, width: width * 2.2 },
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
      <Text
        style={[
          styles.emoji,
          {
            fontSize: Math.round(width * 0.24),
            lineHeight: Math.round(width * 0.3),
            left: width * 0.62,
            top: wordsTop + size * Math.max(2, event.poster.lines.length) + width * 0.08,
          },
        ]}
      >
        {event.poster.emoji}
      </Text>
      <LinearGradient
        colors={
          light
            ? ['rgba(232,230,224,0)', 'rgba(232,230,224,0.7)', 'rgba(232,230,224,0.98)']
            : ['rgba(11,11,16,0)', 'rgba(11,11,16,0.55)', 'rgba(11,11,16,0.94)']
        }
        locations={[scrimFrom, scrimFrom + (1 - scrimFrom) * 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', pointerEvents: 'none' },
  ring: { position: 'absolute', borderWidth: 2, opacity: 0.85 },
  word: { fontFamily: fonts.display, color: '#0B0B10' },
  emoji: { position: 'absolute', transform: [{ rotate: '-18deg' }] },
});
