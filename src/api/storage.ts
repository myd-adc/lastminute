import { supabase } from './client';

export const COVERS = 'covers'; // public: communities/<community id>/<file>
export const AVATARS = 'avatars'; // private: <user id>/<file>, read through signed URLs

// Long enough to outlive a session between syncs; every sync issues fresh ones.
const SIGNED_TTL = 6 * 60 * 60;

// Profile photo uploads in flight: a sync meanwhile must not swap the picked image for the old server one.
export const avatarUploads = { pending: 0 };

// A picked image is a local uri (file:, blob:, data:); one already on the server is an http(s) URL.
export const isPicked = (uri: string) => !/^https?:/.test(uri);

export const publicUrl = (bucket: string, path: string) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

// Uploads under <folder>/<timestamp>.<ext>; a new path each time, so caches never serve the old image.
export async function uploadImage(bucket: string, folder: string, uri: string): Promise<string> {
  const res = await fetch(uri);
  const type = res.headers.get('content-type') ?? (/\.png$/i.test(uri) ? 'image/png' : 'image/jpeg');
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const path = `${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, await res.arrayBuffer(), { contentType: type });
  if (error) throw new Error(error.message);
  return path;
}

// Best-effort: a file left behind costs storage, not correctness.
export async function removeImage(bucket: string, path: string | null | undefined) {
  if (path) await supabase.storage.from(bucket).remove([path]);
}

// path → signed URL for the ones the user may read (the bucket's RLS drops the rest).
export async function signedUrls(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!paths.length) return out;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_TTL);
  for (const s of data ?? []) if (s.path && s.signedUrl && !s.error) out.set(s.path, s.signedUrl);
  return out;
}
