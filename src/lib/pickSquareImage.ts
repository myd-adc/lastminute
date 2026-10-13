import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

// Covers and profile photos: the person card shows them at ~350 pt wide; 800 px stays sharp and far below the 5 MB bucket limit.
const MAX = 800;

// Square crop from the library, scaled down and re-encoded as JPEG. Resolves to a local uri, or null if cancelled.
export async function pickSquareImage(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  const asset = !res.canceled ? res.assets[0] : undefined;
  if (!asset) return null;
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX) ctx.resize({ width: MAX });
  const image = await ctx.renderAsync();
  // Web blob: URLs die with the page, so the demo (which keeps the uri in storage) gets a data: URI there.
  const web = Platform.OS === 'web';
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: web });
  return web && saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
}
