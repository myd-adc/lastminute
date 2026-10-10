import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gradient } from '@/components/ui';
import { getUser } from '@/data/mock';
import type { Photo } from '@/data/types';
import { useT } from '@/i18n';
import { shortStamp } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { onest, useTheme } from '@/theme';

const GAP = 8;

export function useAuthorName() {
  const { state } = useStore();
  const { t } = useT();
  return (authorId: string) => (authorId === 'me' ? (state.me?.name ?? t('chat.thread.me')) : (getUser(authorId)?.name ?? '?'));
}

// Square photo tiles (M14 / W07): gradient + emoji placeholder or the real photo, author initial bottom-left,
// last tile «+ Your photo». Tapping a tile opens a full-screen viewer.
export function AlbumGrid({ photos, columns, onAdd }: { photos: Photo[]; columns: number; onAdd: () => void }) {
  const { c, scheme } = useTheme();
  const { t } = useT();
  const [width, setWidth] = useState(0);
  const [viewing, setViewing] = useState<Photo | null>(null);
  const authorName = useAuthorName();
  const size = width > 0 ? Math.floor((width - GAP * (columns - 1)) / columns) : 0;
  const ink = scheme === 'light' ? c.text : c.accent;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.grid}>
      {size > 0 &&
        photos.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('chat.album.photoBy', { name: authorName(p.authorId) })}
            onPress={() => setViewing(p)}
            style={({ pressed }) => [{ width: size, height: size }, styles.tile, pressed && { opacity: 0.85 }]}
          >
            <PhotoFill photo={p} emojiSize={Math.round(size * 0.26)} />
            <View style={styles.badge}>
              <Text style={[onest('bold', 11), { color: '#F6F5F2' }]}>{authorName(p.authorId).charAt(0).toUpperCase()}</Text>
            </View>
          </Pressable>
        ))}
      {size > 0 && (
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
          <Plus size={28} color={ink} strokeWidth={2} />
          <Text style={[onest('semibold', 12), { color: ink }]}>{t('chat.album.yourPhoto')}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { borderRadius: 16, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11,11,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewer: { flex: 1, backgroundColor: 'rgba(5,5,8,0.96)', alignItems: 'center', justifyContent: 'center' },
  viewerHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  viewerPhoto: { borderRadius: 24, overflow: 'hidden' },
});
