#!/usr/bin/env node
// Brand QR generator for print and social.
//
//   node scripts/qr.mjs --from=kulbaba                       → every format, dark
//   node scripts/qr.mjs --from=kulbaba --format=sticker      → one format
//   node scripts/qr.mjs --from=kulbaba --theme=light         → the lime-field inversion
//
// Writes SVG into assets/qr/.
//
// The piece follows the identity board (Figma 379:235): near-black field, lime mark, the trail
// wedge. The code itself always sits on a lime panel so it keeps dark-on-light polarity — an
// inverted code is a coin flip on older scanners, and this is going on a table in a bar.

import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const QRCode = require('qrcode');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'assets', 'qr');

const INK = '#0B0B10';
const LIME = '#D7FF3B';
const PAPER = '#F6F5F2';
const BASE = 'https://lastminute.software/';

// Error correction H (30%) is what buys us the mark knocked out of the middle.
const ECC = 'H';
const QUIET = 4; // modules; the single most common reason a printed code fails

const FONTS = {
  display: '@expo-google-fonts/unbounded/700Bold/Unbounded_700Bold.ttf',
  medium: '@expo-google-fonts/onest/500Medium/Onest_500Medium.ttf',
};

function fontFace(name, relPath) {
  const b64 = readFileSync(join(root, 'node_modules', relPath)).toString('base64');
  return `@font-face{font-family:'${name}';src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
}

// The "=●" mark, measured off the lockup in the identity file and expressed in dot radii:
// stroke 0.28r, lines at y ±0.65r, running from -2.05r (-2.55r for the middle one) to -1.3r.
function mark(cx, cy, r, colour) {
  const sw = r * 0.28;
  const line = (dy, x0) =>
    `<path d="M${(cx + r * x0).toFixed(3)} ${(cy + r * dy).toFixed(3)}H${(cx - r * 1.3).toFixed(3)}" stroke="${colour}" stroke-width="${sw.toFixed(3)}" stroke-linecap="round"/>`;
  return [
    `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${r.toFixed(3)}" fill="${colour}"/>`,
    line(-0.65, -2.05),
    line(0, -2.55),
    line(0.65, -2.05),
  ].join('');
}

const MARK_LEFT = 2.55 + 0.14; // how far the mark reaches left of the dot centre, in radii

function matrix(url) {
  const qr = QRCode.create(url, { errorCorrectionLevel: ECC });
  const n = qr.modules.size;
  const data = qr.modules.data;
  return { n, at: (x, y) => data[y * n + x] === 1, version: qr.version };
}

const inFinder = (x, y, n) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

// `panel` is the lime card; `size` is the code including its quiet zone.
function drawQr(url, size, x0, y0) {
  const { n, at, version } = matrix(url);
  const total = n + QUIET * 2;
  const m = size / total;
  const px = (i) => x0 + (i + QUIET) * m;
  const py = (i) => y0 + (i + QUIET) * m;

  const cx = x0 + size / 2;
  const cy = y0 + size / 2;
  const hole = size * 0.2; // ~20% of the area, comfortably inside what ECC H can rebuild

  const parts = [];

  // Modules are rounded squares at full size, not loose dots: a decoder reads run lengths and
  // gaps between neighbours break them. The softness comes from the corner radius alone.
  const cells = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!at(x, y) || inFinder(x, y, n)) continue;
      const mx = px(x) + m / 2;
      const my = py(y) + m / 2;
      if (Math.hypot(mx - cx, my - cy) < hole / 2 + m * 0.6) continue;
      cells.push(`<rect x="${px(x).toFixed(3)}" y="${py(y).toFixed(3)}" width="${m.toFixed(3)}" height="${m.toFixed(3)}" rx="${(m * 0.3).toFixed(3)}"/>`);
    }
  }
  parts.push(`<g fill="${INK}">${cells.join('')}</g>`);

  // Finder eyes keep the exact 7-5-3 proportions the detector looks for; only corners soften.
  for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    const X = px(fx);
    const Y = py(fy);
    parts.push(
      `<rect x="${X.toFixed(3)}" y="${Y.toFixed(3)}" width="${(m * 7).toFixed(3)}" height="${(m * 7).toFixed(3)}" rx="${(m * 0.9).toFixed(3)}" fill="${INK}"/>`,
      `<rect x="${(X + m).toFixed(3)}" y="${(Y + m).toFixed(3)}" width="${(m * 5).toFixed(3)}" height="${(m * 5).toFixed(3)}" rx="${(m * 0.7).toFixed(3)}" fill="${LIME}"/>`,
      `<rect x="${(X + m * 2).toFixed(3)}" y="${(Y + m * 2).toFixed(3)}" width="${(m * 3).toFixed(3)}" height="${(m * 3).toFixed(3)}" rx="${(m * 0.55).toFixed(3)}" fill="${INK}"/>`,
    );
  }

  // The mark sits in the knockout, shifted right so its trailing lines stay inside the clearing.
  const r = hole * 0.27;
  parts.push(mark(cx + r * (MARK_LEFT - 1) / 2, cy, r, INK));

  return { svg: parts.join(''), modulePx: m, version, n };
}

// Layouts are declared in their own unit: millimetres for print, pixels for social.
const FORMATS = {
  sticker: { w: 70, h: 70, unit: 'mm', panel: 44, wordmark: 3.6, headline: 4.8, cta: 3.1, gap: 3.1, bleed: 3 },
  square: { w: 1080, h: 1080, unit: 'px', panel: 640, wordmark: 46, headline: 72, cta: 44, gap: 42 },
  story: { w: 1080, h: 1920, unit: 'px', panel: 700, wordmark: 52, headline: 90, cta: 52, gap: 76 },
};

function build(name, slug, theme) {
  const f = FORMATS[name];
  const url = slug ? `${BASE}?from=${encodeURIComponent(slug)}` : BASE;
  const u = f.unit;
  const bleed = f.bleed ?? 0;
  const W = f.w + bleed * 2;
  const H = f.h + bleed * 2;
  const light = theme === 'light';
  const field = light ? LIME : INK;
  const onField = light ? INK : PAPER;
  const sub = light ? INK : PAPER;
  const subOpacity = light ? 0.62 : 0.66;

  // Stack the blocks, measure the whole thing, then centre it, so no format ends up top-heavy
  // with a dead band underneath.
  const capWordmark = f.wordmark * 0.72;
  const capHeadline = f.headline * 0.72;
  const capCta = f.cta * 0.72;
  const stackH = capWordmark + f.gap + f.panel + f.gap + capHeadline + f.gap * 0.4 + capCta;
  const top = bleed + (f.h - stackH) / 2;

  const wordmarkY = top + capWordmark;
  const panelY = wordmarkY + f.gap;
  const headlineY = panelY + f.panel + f.gap + capHeadline;
  const ctaY = headlineY + f.gap * 0.4 + capCta;

  const panelX = bleed + (f.w - f.panel) / 2;
  const inset = f.panel * 0.085; // lime margin around the code, on top of its own quiet zone
  const { svg: code, modulePx, version, n } = drawQr(url, f.panel - inset * 2, panelX + inset, panelY + inset);

  const cxc = bleed + f.w / 2;

  // The trail: a wedge sweeping out of the bottom-left corner. Anchored below the last line of
  // type so it never runs underneath the words — on a sticker that mush is what kills legibility.
  const tw = light ? INK : LIME;
  const trailTop = Math.max(ctaY + capCta * 0.9, H - f.h * 0.22);
  const trail = `<path d="M${-1} ${H} L${-1} ${trailTop.toFixed(2)} Q${(W * 0.45).toFixed(2)} ${(trailTop + (H - trailTop) * 0.52).toFixed(2)} ${(W + 1).toFixed(2)} ${(H - (H - trailTop) * 0.06).toFixed(2)} L${(W + 1).toFixed(2)} ${H} Z" fill="${tw}" opacity="${light ? 0.14 : 0.22}"/>`;

  const css = fontFace('LM Display', FONTS.display) + fontFace('LM Text', FONTS.medium);

  // Lockup: the mark, then the wordmark. Centre the pair by shifting the text right of the dot.
  const mr = f.wordmark * 0.3;
  const lockShift = f.wordmark * 1.5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}${u === 'mm' ? 'mm' : ''}" height="${H}${u === 'mm' ? 'mm' : ''}" viewBox="0 0 ${W} ${H}">
<style>${css}</style>
<rect width="${W}" height="${H}" fill="${field}"/>
${trail}
${mark(cxc - lockShift, wordmarkY - capWordmark * 0.46, mr, light ? INK : LIME)}
<text x="${(cxc - lockShift + mr * 1.9).toFixed(3)}" y="${wordmarkY.toFixed(3)}" text-anchor="start" font-family="LM Display" font-size="${f.wordmark}" fill="${onField}" letter-spacing="${(f.wordmark * 0.005).toFixed(3)}">lastminute</text>
<rect x="${panelX.toFixed(3)}" y="${panelY.toFixed(3)}" width="${f.panel}" height="${f.panel}" rx="${(f.panel * 0.09).toFixed(3)}" fill="${LIME}"/>
${code}
<g text-anchor="middle">
  <text x="${cxc}" y="${headlineY.toFixed(3)}" font-family="LM Display" font-size="${f.headline}" fill="${onField}" letter-spacing="${(-f.headline * 0.03).toFixed(3)}">Не йди сам.</text>
  <text x="${cxc}" y="${ctaY.toFixed(3)}" font-family="LM Text" font-size="${f.cta}" fill="${sub}" opacity="${subOpacity}">Наведи камеру</text>
</g>
</svg>`;

  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, `lastminute-${name}-${theme}${slug ? `-${slug}` : ''}.svg`);
  writeFileSync(file, svg);
  return { file, url, modulePx, unit: u, version, n };
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const slug = typeof args.from === 'string' ? args.from : '';
const themes = args.theme ? [args.theme] : ['dark', 'light'];
const names = args.format ? [args.format] : Object.keys(FORMATS);

for (const name of names) {
  if (!FORMATS[name]) {
    console.error(`unknown format: ${name} (have: ${Object.keys(FORMATS).join(', ')})`);
    process.exit(1);
  }
  for (const theme of themes) {
    const r = build(name, slug, theme);
    const mm = r.unit === 'mm' ? ` · module ${r.modulePx.toFixed(2)}mm${r.modulePx < 0.6 ? '  ⚠ below 0.6mm, too small to print' : ''}` : '';
    console.log(`${r.file}\n  ${r.url}\n  v${r.version} · ${r.n}×${r.n} · ECC ${ECC} · quiet ${QUIET}${mm}`);
  }
}
