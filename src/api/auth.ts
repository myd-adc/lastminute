import type { GoesWith, InterestId, SceneId, Vibe } from '@/data/types';
import type { Me, State } from '@/store/state';
import type { GradientId } from '@/theme/palette';

import { supabase } from './client';

export type AuthResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const fail = (error: { message?: string } | null | undefined, fallback: string): { ok: false; error: string } => ({
  ok: false,
  error: error?.message ?? fallback,
});

// Sends the login code. Sandbox: test_otp numbers in supabase/config.toml get a fixed code and no SMS.
export async function requestCode(phone: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return error ? fail(error, 'otp_failed') : { ok: true, data: undefined };
}

export type ExistingAccount = {
  me: Me;
  interests: InterestId[];
  vibe: Vibe | null;
  goesWith: GoesWith | null;
  sceneId: SceneId | null;
  studentEmail: string | null;
};

// Verifies the code and returns the saved profile for returning users (null = new account → onboarding).
export async function verifyCode(phone: string, token: string): Promise<AuthResult<ExistingAccount | null>> {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error || !data.user) return fail(error, 'verify_failed');
  return { ok: true, data: await loadAccount(data.user.id) };
}

export async function loadAccount(userId: string): Promise<ExistingAccount | null> {
  const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!p) return null;
  const { data: member } = await supabase
    .from('scene_members')
    .select('verified_email')
    .eq('user_id', userId)
    .not('verified_at', 'is', null)
    .limit(1)
    .maybeSingle();
  return {
    me: { name: p.name, affiliation: p.affiliation, talkAbout: p.talk_about, gradient: p.gradient as GradientId, photoUri: p.photo_path ?? undefined },
    interests: p.interests as InterestId[],
    vibe: (p.vibe as Vibe | null) ?? null,
    goesWith: (p.goes_with as GoesWith | null) ?? null,
    sceneId: (p.scene_id as SceneId | null) ?? null,
    studentEmail: member?.verified_email ?? null,
  };
}

// Persists the onboarding answers (M03–M05) for the signed-in user.
export async function saveProfile(state: State): Promise<AuthResult> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId || !state.me) return { ok: false, error: 'not_signed_in' };
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: state.me.name,
    affiliation: state.me.affiliation,
    talk_about: state.me.talkAbout,
    gradient: state.me.gradient,
    interests: state.interests,
    vibe: state.vibe,
    goes_with: state.goesWith,
    scene_id: state.sceneId,
    show_solo: state.settings.showSolo,
    show_shared: state.settings.showSharedEvents,
    language: state.language,
  });
  if (error) return fail(error, 'save_failed');
  if (state.sceneId) {
    // Campus scenes check the confirmed e-mail domain on the server.
    const { error: joinError } = await supabase.rpc('join_scene', { p_scene: state.sceneId });
    if (joinError) return fail(joinError, 'join_failed');
  }
  return { ok: true, data: undefined };
}

// Student e-mail check for campus scenes: Auth mails a code to the new address, the confirmed address is what
// join_scene trusts on the server.
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
