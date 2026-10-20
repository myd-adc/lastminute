import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { requestCrop } from './cropRequest';

// Covers and profile photos: the person card shows them at ~350 pt wide; 800 px stays sharp and far below the 5 MB bucket limit.
const MAX = 800;

// Square crop from the library, scaled down and re-encoded as JPEG. Resolves to a local uri, or null if cancelled.
// The phone's own picker crops natively; a browser has no crop step, so the in-app cropper frames the photo there.
export async function pickSquareImage(): Promise<string | null> {
  const web = Platform.OS === 'web';
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: !web, aspect: [1, 1], quality: 1 });
  const asset = !res.canceled ? res.assets[0] : undefined;
  if (!asset) return null;
  const ctx = ImageManipulator.manipulate(asset.uri);
  let side = asset.width;
  if (web) {
    const rect = await requestCrop(asset.uri, asset.width, asset.height);
    if (!rect) return null;
    ctx.crop(rect);
    side = rect.width;
  }
  if (side > MAX) ctx.resize({ width: MAX });
  const image = await ctx.renderAsync();
  // Web blob: URLs die with the page, so the demo (which keeps the uri in storage) gets a data: URI there.
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: web });
  return web && saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
}

// Event posters keep their own shape (mostly portrait), just scaled to a sharp feed width.
const POSTER_MAX = 1080;
export async function pickPosterImage(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = !res.canceled ? res.assets[0] : undefined;
  if (!asset) return null;
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width > POSTER_MAX) ctx.resize({ width: POSTER_MAX });
  const image = await ctx.renderAsync();
  const web = Platform.OS === 'web';
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.82, base64: web });
  return web && saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
}
