import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { loadAccount, type AuthResult, type ExistingAccount } from './auth';
import { supabase } from './client';

export type OAuthProvider = 'google';

// Off until the provider is enabled in the Supabase dashboard; otherwise the button would lead to an error page.
export const googleEnabled = process.env.EXPO_PUBLIC_OAUTH_GOOGLE === '1';
export type OAuthDone = { email: string; account: ExistingAccount | null };

// Where the provider sends the browser back: the /auth-callback route on web, lastminute://auth-callback in the app.
// Every form of it must be in Supabase's redirect allow-list (supabase/config.toml, additional_redirect_urls).
export const oauthRedirect = () => Linking.createURL('auth-callback');

// Web leaves the page for the provider and comes back to /auth-callback, so it resolves to 'redirected'.
// The app opens an auth browser session and finishes here.
export async function signInWithProvider(provider: OAuthProvider): Promise<AuthResult<OAuthDone | 'redirected'>> {
  const redirectTo = oauthRedirect();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
  });
  if (error || !data.url) return { ok: false, error: 'oauth_failed' };
  if (Platform.OS === 'web') return { ok: true, data: 'redirected' };
  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return { ok: false, error: 'cancelled' };
  return finishOAuth(res.url);
}

// The app can get the same callback twice (the auth session and the deep link), so one code is exchanged once.
const exchanges = new Map<string, Promise<AuthResult<OAuthDone>>>();

// Trades the ?code= of the callback URL for a session (PKCE) and loads the saved profile, if there is one.
export function finishOAuth(url: string): Promise<AuthResult<OAuthDone>> {
  const params = Linking.parse(url).queryParams ?? {};
  const code = typeof params.code === 'string' ? params.code : null;
  if (!code) return Promise.resolve({ ok: false, error: params.error ? 'denied' : 'oauth_failed' });
  const running = exchanges.get(code);
  if (running) return running;
  const next = (async (): Promise<AuthResult<OAuthDone>> => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user ?? (error ? (await supabase.auth.getSession()).data.session?.user : null);
    if (!user) return { ok: false, error: 'oauth_failed' };
    return { ok: true, data: { email: user.email ?? '', account: await loadAccount(user.id) } };
  })();
  exchanges.set(code, next);
  return next;
}
