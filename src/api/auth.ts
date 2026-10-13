import type { GoesWith, InterestId, Vibe } from '@/data/types';
import type { Me, State } from '@/store/state';
import type { GradientId } from '@/theme/palette';

import { supabase } from './client';
import { AVATARS, avatarUploads, isPicked, removeImage, signedUrls, uploadImage } from './storage';

export type AuthResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const fail = (error: { message?: string } | null | undefined, fallback: string): { ok: false; error: string } => ({
  ok: false,
  error: error?.message ?? fallback,
});

// Mails the 6-digit sign-in code; a new address becomes a new account.
export async function requestCode(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return error ? fail(error, 'otp_failed') : { ok: true, data: undefined };
}

export type ExistingAccount = {
  me: Me;
  interests: InterestId[];
  vibe: Vibe | null;
  goesWith: GoesWith | null;
};

// Verifies the code and returns the saved profile for returning users (null = new account → onboarding).
export async function verifyCode(email: string, token: string): Promise<AuthResult<ExistingAccount | null>> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error || !data.user) return fail(error, 'verify_failed');
  return { ok: true, data: await loadAccount(data.user.id) };
}

export async function loadAccount(userId: string): Promise<ExistingAccount | null> {
  const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!p) return null;
  return {
    me: {
      name: p.name,
      affiliation: p.affiliation,
      talkAbout: p.talk_about,
      gradient: p.gradient as GradientId,
      photoUri: p.photo_path ? (await signedUrls(AVATARS, [p.photo_path])).get(p.photo_path) : undefined,
    },
    interests: p.interests as InterestId[],
    vibe: (p.vibe as Vibe | null) ?? null,
    goesWith: (p.goes_with as GoesWith | null) ?? null,
  };
}

// Persists the onboarding answers (M03–M04) for the signed-in user.
export async function saveProfile(state: State): Promise<AuthResult> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId || !state.me) return { ok: false, error: 'not_signed_in' };
  // A picked photo is uploaded; a server URL means unchanged; none removes it.
  const { data: current } = await supabase.from('profiles').select('photo_path').eq('id', userId).maybeSingle();
  const previous = current?.photo_path ?? null;
  const uri = state.me.photoUri;
  let photo_path = uri ? previous : null;
  if (uri && isPicked(uri)) {
    avatarUploads.pending++;
    try {
      photo_path = await uploadImage(AVATARS, userId, uri);
    } catch (e) {
      return fail(e as { message: string }, 'save_failed');
    } finally {
      avatarUploads.pending--;
    }
  }
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: state.me.name,
    affiliation: state.me.affiliation,
    talk_about: state.me.talkAbout,
    gradient: state.me.gradient,
    interests: state.interests,
    vibe: state.vibe,
    goes_with: state.goesWith,
    show_solo: state.settings.showSolo,
    show_shared: state.settings.showSharedEvents,
    language: state.language,
    photo_path,
  });
  if (error) return fail(error, 'save_failed');
  if (previous && previous !== photo_path) await removeImage(AVATARS, previous);
  return { ok: true, data: undefined };
}

// Domain-only community for someone who signed in with another address: Auth mails a code to the campus one and,
// once confirmed, it replaces the sign-in address. join_community trusts only that confirmed address.
export async function requestStudentEmailCode(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ email });
  if (!error) return { ok: true, data: undefined };
  return { ok: false, error: /already|registered|taken/i.test(error.message) ? 'email_taken' : 'email_failed' };
}

export async function verifyStudentEmail(email: string, token: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email_change' });
  return error ? fail(error, 'code_failed') : { ok: true, data: undefined };
}

export const signOut = () => supabase.auth.signOut();
