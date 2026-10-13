// @username rules, kept in step with profiles_username_format in supabase/migrations/…_usernames.sql:
// 3–20 chars of a–z, 0–9, «_» and «.», no dot at either end or twice in a row.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
const RE = /^[a-z0-9_](?:[a-z0-9_]|\.(?!\.))*[a-z0-9_]$/;

export const isValidUsername = (u: string) => u.length >= USERNAME_MIN && u.length <= USERNAME_MAX && RE.test(u);

// What the field keeps while typing: lower case, no «@», only allowed characters.
export const cleanUsernameInput = (s: string) =>
  s
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, USERNAME_MAX);

// Ukrainian → Latin (simplified national transliteration), enough for a readable suggestion.
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'io', ъ: '', '’': '', "'": '', 'ʼ': '',
};

const shape = (s: string) =>
  s
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_.]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, USERNAME_MAX)
    .replace(/[._]+$/, '');

// «olya.k@ucu.edu.ua» → «olya.k»; otherwise the name: «Тарас Коваль» → «taras_koval».
export function suggestUsername(name: string, email?: string | null): string {
  const local = email?.split('@')[0]?.toLowerCase() ?? '';
  const fromEmail = shape(local);
  if (isValidUsername(fromEmail)) return fromEmail;
  const latin = [...name.trim().toLowerCase()].map((ch) => TRANSLIT[ch] ?? ch).join('');
  const fromName = shape(latin);
  return fromName.length >= USERNAME_MIN ? fromName : fromName ? `${fromName}_${fromName.length}${fromName.length}` : '';
}

// «@taras.k · Філософія, 4 курс»: the handle first, then whatever else is set.
export const withHandle = (username: string | undefined, ...rest: (string | null | undefined)[]) =>
  [username && `@${username}`, ...rest.map((r) => r?.trim())].filter(Boolean).join(' · ');
