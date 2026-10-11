import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gradient } from '@/components/ui';
import { getUser } from '@/data/mock';
import type { Photo } from '@/data/types';
import { useT } from '@/i18n';
import { countdown, shortStamp } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

export function useAuthorName() {
  const { state } = useStore();
  const { t } = useT();
  return (authorId: string) => (authorId === 'me' ? (state.me?.name ?? t('chat.thread.me')) : (getUser(authorId)?.name ?? '?'));
}

// Square photo tiles. Phone (M14): 3 columns, 4 pt gap, 12 pt radius, author initial bottom-left, last tile «+ Your photo».
// Wide (W07): ~180 pt tiles, 10 pt gap, 14 pt radius, author + «20 хв» chip, own photos outlined with a «Твоє» pill,
// no add tile (the right panel has the drop zone). Tapping a tile opens a full-screen viewer.
export function AlbumGrid({ photos, wide, onAdd }: { photos: Photo[]; wide?: boolean; onAdd: () => void }) {
  const { c } = useTheme();
  const { t } = useT();
  const now = useNow();
  const [width, setWidth] = useState(0);
  const [viewing, setViewing] = useState<Photo | null>(null);
  const authorName = useAuthorName();
  const gap = wide ? 10 : 4;
  const columns = wide ? Math.max(3, Math.floor((width + gap) / (180 + gap))) : 3;
  const size = width > 0 ? Math.floor((width - gap * (columns - 1)) / columns) : 0;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={[styles.grid, { gap }]}>
      {size > 0 &&
        photos.map((p) => {
          const mine = p.authorId === 'me';
          const initial = authorName(p.authorId).charAt(0).toUpperCase();
          return (
            <Pressable
              key={p.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('chat.album.photoBy', { name: authorName(p.authorId) })}
              onPress={() => setViewing(p)}
              style={({ pressed }) => [
                { width: size, height: size, borderRadius: wide ? 14 : 12 },
                styles.tile,
                wide && mine && { borderWidth: 3, borderColor: c.accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <PhotoFill photo={p} emojiSize={Math.round(size * (wide ? 0.245 : 0.26))} />
              {wide ? (
                <View style={[styles.chip, { backgroundColor: c.bg }, mine ? { left: 5, bottom: 1 } : { left: 8, bottom: 4 }]}>
                  <View style={[styles.chipFace, { backgroundColor: c.surface2 }]}>
                    <Text style={[onest('bold', 10), { color: c.text }]}>{initial}</Text>
                  </View>
                  <Text style={[onest('medium', 11), { color: c.text }]}>{countdown(now - Date.parse(p.at))}</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: c.bg }]}>
                  <Text style={[onest('bold', 10), { color: c.text }]}>{initial}</Text>
                </View>
              )}
              {wide && mine && (
                <View style={[styles.mine, { backgroundColor: c.accent }]}>
                  <Text style={[onest('bold', 13), { color: c.onAccent }]}>{t('chat.album.mine')}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      {size > 0 && !wide && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.album.addYours')}
          onPress={onAdd}
          style={({ pressed }) => [
            { width: size, height: size },
            styles.tile,
            styles.add,
            { borderColor: c.accent },
            pressed && { backgroundColor: c.accentSoft },
          ]}
        >
          <Plus size={24} color={c.accentInk} strokeWidth={2} />
          <Text style={[onest('semibold', 12), { color: c.accentInk }]}>{t('chat.album.yourPhoto')}</Text>
        </Pressable>
      )}
      <PhotoViewer photo={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

function PhotoFill({ photo, emojiSize }: { photo: Photo; emojiSize: number }) {
  if (photo.uri) return <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
  return (
    <Gradient id={photo.gradient} style={[StyleSheet.absoluteFill, styles.center]}>
      <Text style={{ fontSize: emojiSize }}>{photo.emoji}</Text>
    </Gradient>
  );
}

function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const now = useNow();
  const authorName = useAuthorName();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const side = Math.min(box.w - 32, box.h - 160, 720);
  return (
    <Modal visible={!!photo} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {photo && (
          <>
            <View style={[styles.viewerHeader, { paddingTop: insets.top + 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[onest('bold', 16), { color: '#F6F5F2' }]}>{authorName(photo.authorId)}</Text>
                <Text style={[onest('regular', 13), { color: 'rgba(246,245,242,0.6)' }]}>{shortStamp(photo.at, now)}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('chat.album.close')} onPress={onClose} hitSlop={10} style={styles.close}>
                <X size={22} color="#F6F5F2" />
              </Pressable>
            </View>
            {side > 0 && (
              <View style={[styles.viewerPhoto, { width: side, height: side }]}>
                <PhotoFill photo={photo} emojiSize={Math.round(side * 0.3)} />
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderRadius: 12, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', left: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chip: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 10, paddingVertical: 4, borderRadius: 14 },
  chipFace: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mine: { position: 'absolute', top: 2, right: 2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14 },
  add: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  viewer: { flex: 1, backgroundColor: 'rgba(5,5,8,0.96)', alignItems: 'center', justifyContent: 'center' },
  viewerHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  viewerPhoto: { borderRadius: 24, overflow: 'hidden' },
});
