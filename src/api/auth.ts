import type { GoesWith, InterestId, SpokenLang, Vibe } from '@/data/types';
import type { Me, State } from '@/store/state';
import type { GradientId } from '@/theme/palette';

import { supabase } from './client';
import { AVATARS, avatarUploads, isPicked, removeImage, signedUrls, uploadImage } from './storage';

export type AuthResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const fail = (error: { message?: string } | null | undefined, fallback: string): { ok: false; error: string } => ({
  ok: false,
  error: error?.message ?? fallback,
});

export const PASSWORD_MIN = 8; // auth.minimum_password_length in supabase/config.toml

// Sign-up: the account is created with its password, and Auth mails a 6-digit code to confirm the address.
// An address that is already registered comes back as a user without identities (Auth hides who exists).
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return fail(error, /registered|exists/i.test(error.message) ? 'exists' : 'signup_failed');
  if (data.user && data.user.identities?.length === 0) return { ok: false, error: 'exists' };
  return { ok: true, data: undefined };
}

// Sign-in with @username or e-mail. A username is traded for the address by login_email(), which answers only
// when the password matches; then Auth checks the password again and opens the session.
export async function signIn(login: string, password: string): Promise<AuthResult<{ email: string; account: ExistingAccount | null }>> {
  // «@taras.k» is a username too: only an «@» after the first character makes it an address.
  let email = login.trim().toLowerCase().replace(/^@/, '');
  if (!email.includes('@')) {
    const { data, error } = await supabase.rpc('login_email', { p_login: email, p_password: password });
    if (error) return { ok: false, error: /too many/i.test(error.message) ? 'too_many' : 'signin_failed' };
    if (!data) return { ok: false, error: 'invalid' };
    email = data;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: /confirm/i.test(error.message) ? 'unconfirmed' : /invalid/i.test(error.message) ? 'invalid' : 'signin_failed' };
  return { ok: true, data: { email, account: await loadAccount(data.user.id) } };
}

// The 6-digit code again: confirmation for sign-up, recovery for "Forgot your password?".
export async function resendCode(email: string, mode: CodeMode): Promise<AuthResult> {
  const { error } = mode === 'signup' ? await supabase.auth.resend({ type: 'signup', email }) : await supabase.auth.resetPasswordForEmail(email);
  return error ? fail(error, 'otp_failed') : { ok: true, data: undefined };
}

// "Forgot your password?": mails a recovery code. Also how accounts made before passwords get one.
export async function requestReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return error ? fail(error, 'otp_failed') : { ok: true, data: undefined };
}

export async function setPassword(password: string): Promise<AuthResult<ExistingAccount | null>> {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error || !data.user) return fail(error, 'password_failed');
  return { ok: true, data: await loadAccount(data.user.id) };
}

export type CodeMode = 'signup' | 'reset';

export type ExistingAccount = {
  me: Me;
  interests: InterestId[];
  vibe: Vibe | null;
  goesWith: GoesWith | null;
};

// Verifies the code and returns the saved profile for returning users (null = new account → onboarding).
// The recovery code signs the user in, so the next screen can set the new password.
export async function verifyCode(email: string, token: string, mode: CodeMode): Promise<AuthResult<ExistingAccount | null>> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: mode === 'reset' ? 'recovery' : 'email' });
  if (error || !data.user) return fail(error, 'verify_failed');
  return { ok: true, data: await loadAccount(data.user.id) };
}

export async function loadAccount(userId: string): Promise<ExistingAccount | null> {
  const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!p) return null;
  return {
    me: {
      name: p.name,
      username: p.username,
      affiliation: p.affiliation,
      talkAbout: p.talk_about,
      birthYear: p.birth_year ?? undefined,
      gender: (p.gender as 'f' | 'm' | null) ?? undefined,
      languages: (p.languages as SpokenLang[] | null) ?? undefined,
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
    birth_year: state.me.birthYear ?? null,
    gender: state.me.gender ?? null,
    languages: state.me.languages ?? [],
    gradient: state.me.gradient,
    interests: state.interests,
    vibe: state.vibe,
    goes_with: state.goesWith,
    show_solo: state.settings.showSolo,
    show_shared: state.settings.showSharedEvents,
    language: state.language,
    photo_path,
    ...(state.me.username && { username: state.me.username }),
  });
  if (error?.code === '23505') return { ok: false, error: 'username_taken' };
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

// Whether a username is free (the user's own counts as free). A failed check reads as free; the save still guards it.
export async function usernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('username_available', { p_username: username });
  return error ? true : !!data;
}
