// QR codes always carry the public web address, never the app scheme: the person scanning may not have the app.
export const SITE = 'https://lastminute.software';

const tagged = (path: string, from: string) => `${SITE}${path}?from=${from}`;

// A UUID in base62 is 22 characters instead of 36, which keeps a QR link at version 6 or below: no alignment
// pattern in the middle of the code, so the "=●" mark can sit there. /e/ and /c/ expand back in src/app.
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIXTY_TWO = BigInt(62);

export function shortId(uuid: string) {
  let n = BigInt(`0x${uuid.replace(/-/g, '')}`);
  let s = '';
  while (n > BigInt(0)) {
    s = B62[Number(n % SIXTY_TWO)] + s;
    n /= SIXTY_TWO;
  }
  return s.padStart(22, '0');
}

export function longId(code: string): string | null {
  if (!/^[0-9A-Za-z]{22}$/.test(code)) return null;
  let n = BigInt(0);
  for (const ch of code) n = n * SIXTY_TWO + BigInt(B62.indexOf(ch));
  const hex = n.toString(16).padStart(32, '0');
  if (hex.length > 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Demo data has non-UUID ids; those keep the long link.
const short = (prefix: string, long: string, id: string) => (UUID.test(id) ? `${SITE}/${prefix}/${shortId(id)}` : tagged(`/${long}/${id}`, 'qr'));

export const siteQrUrl = tagged('/', 'web');
export const eventQrUrl = (id: string) => short('e', 'event', id);
export const communityQrUrl = (id: string) => short('c', 'community', id);
