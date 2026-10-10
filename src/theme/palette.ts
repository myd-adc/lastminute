// Colour tokens mirror the Figma variables of "v4 · Свайп подій" (color/*), one set per theme.
export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  // Not Figma variables, but used consistently across the v4 frames.
  danger: string;
  dangerSoft: string;
  accentSoft: string;
  scrim: string;
};

export const dark: Palette = {
  bg: '#0B0B10',
  surface: '#16161D',
  surface2: '#22222C',
  line: '#2C2C38',
  text: '#F6F5F2',
  muted: '#8D8C99',
  accent: '#D7FF3B',
  onAccent: '#0B0B10',
  danger: '#FF3D8B',
  dangerSoft: 'rgba(255,61,139,0.14)',
  accentSoft: 'rgba(215,255,59,0.14)',
  scrim: 'rgba(11,11,16,0.6)',
};

export const light: Palette = {
  bg: '#F6F5F1',
  surface: '#FFFFFF',
  surface2: '#EDECE6',
  line: '#E0DED6',
  text: '#0B0B10',
  muted: '#6B6A75',
  accent: '#D7FF3B',
  onAccent: '#0B0B10',
  danger: '#E5306F',
  dangerSoft: 'rgba(229,48,111,0.1)',
  accentSoft: 'rgba(215,255,59,0.35)',
  scrim: 'rgba(11,11,16,0.35)',
};

// Gradients used for event posters, avatars and album tiles. Angles follow the Figma fills (~145°).
export const gradients = {
  sunset: ['#FF8A3D', '#FF3D8B', '#7C5CFF'],
  aurora: ['#3DD9FF', '#7C5CFF', '#FF3D8B'],
  lime: ['#3DFFB0', '#D7FF3B'],
  ocean: ['#3DD9FF', '#3D7CFF'],
  candy: ['#FF3D8B', '#FF8A3D'],
  violet: ['#7C5CFF', '#3DD9FF'],
  ember: ['#FF5A3D', '#FFB13D'],
  dusk: ['#2C2C38', '#7C5CFF'],
} as const satisfies Record<string, readonly string[]>;

export type GradientId = keyof typeof gradients;
export const gradientIds = Object.keys(gradients) as GradientId[];
