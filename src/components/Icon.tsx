import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

// Paths are exported from the Figma file (v3); only stroke/fill colour is parameterised.
type PathSpec = { d: string; width?: number; fill?: boolean; cap?: boolean; join?: boolean };
type IconSpec = { viewBox: number; paths: PathSpec[] };

const icons = {
  calendar: {
    viewBox: 22,
    paths: [
      {
        d: 'M15.5833 4.58333H6.41667C4.39162 4.58333 2.75 6.22496 2.75 8.25V15.5833C2.75 17.6084 4.39162 19.25 6.41667 19.25H15.5833C17.6084 19.25 19.25 17.6084 19.25 15.5833V8.25C19.25 6.22496 17.6084 4.58333 15.5833 4.58333Z',
        width: 1.8,
      },
      { d: 'M2.75 9.16667H19.25M7.33333 2.75V6.41667M14.6667 2.75V6.41667', width: 1.8, cap: true },
    ],
  },
  sparkles: {
    viewBox: 22,
    paths: [
      {
        d: 'M11 2.75L12.65 7.51667L17.4167 9.16667L12.65 10.8167L11 15.5833L9.35 10.8167L4.58333 9.16667L9.35 7.51667L11 2.75Z',
        width: 1.6,
        join: true,
      },
      {
        d: 'M16.9583 14.2083L17.6917 16.225L19.7083 16.9583L17.6917 17.6917L16.9583 19.7083L16.225 17.6917L14.2083 16.9583L16.225 16.225L16.9583 14.2083Z',
        width: 1.2,
        join: true,
      },
    ],
  },
  person: {
    viewBox: 22,
    paths: [
      {
        d: 'M11 11C13.025 11 14.6667 9.35838 14.6667 7.33333C14.6667 5.30829 13.025 3.66667 11 3.66667C8.97496 3.66667 7.33333 5.30829 7.33333 7.33333C7.33333 9.35838 8.97496 11 11 11Z',
        width: 1.8,
      },
      { d: 'M4.125 18.3333C5.225 15.2167 7.79167 13.75 11 13.75C14.2083 13.75 16.775 15.2167 17.875 18.3333', width: 1.8, cap: true },
    ],
  },
  back: {
    viewBox: 18,
    paths: [{ d: 'M10.875 13.5L6.375 9L10.875 4.5', width: 2.4, cap: true, join: true }],
  },
  chevron: {
    viewBox: 20,
    paths: [{ d: 'M7.91667 15L12.9167 10L7.91667 5', width: 2.2, cap: true, join: true }],
  },
  clock: {
    viewBox: 20,
    paths: [
      {
        d: 'M10 17.0833C13.912 17.0833 17.0833 13.912 17.0833 10C17.0833 6.08798 13.912 2.91667 10 2.91667C6.08798 2.91667 2.91667 6.08798 2.91667 10C2.91667 13.912 6.08798 17.0833 10 17.0833Z',
        width: 1.8,
      },
      { d: 'M10 6.25V10L12.5 11.6667', width: 1.8, cap: true, join: true },
    ],
  },
  pin: {
    viewBox: 20,
    paths: [
      {
        d: 'M10 17.5C10 17.5 15.8333 12.8333 15.8333 8.33333C15.8333 7.56729 15.6825 6.80875 15.3893 6.10101C15.0961 5.39328 14.6665 4.75022 14.1248 4.20854C13.5831 3.66687 12.9401 3.23719 12.2323 2.94404C11.5246 2.65088 10.766 2.5 10 2.5C9.23396 2.5 8.47541 2.65088 7.76768 2.94404C7.05995 3.23719 6.41689 3.66687 5.87521 4.20854C5.33354 4.75022 4.90385 5.39328 4.6107 6.10101C4.31755 6.80875 4.16667 7.56729 4.16667 8.33333C4.16667 12.8333 10 17.5 10 17.5Z',
        width: 1.8,
        join: true,
      },
      {
        d: 'M10 10.5C11.1966 10.5 12.1667 9.52995 12.1667 8.33333C12.1667 7.13672 11.1966 6.16667 10 6.16667C8.80338 6.16667 7.83333 7.13672 7.83333 8.33333C7.83333 9.52995 8.80338 10.5 10 10.5Z',
        width: 1.8,
      },
    ],
  },
  lock: {
    viewBox: 24,
    paths: [
      {
        d: 'M16 10H8C6.067 10 4.5 11.567 4.5 13.5V17C4.5 18.933 6.067 20.5 8 20.5H16C17.933 20.5 19.5 18.933 19.5 17V13.5C19.5 11.567 17.933 10 16 10Z',
        width: 1.8,
      },
      {
        d: 'M8 10V7.5C8 6.43913 8.42143 5.42172 9.17157 4.67157C9.92172 3.92143 10.9391 3.5 12 3.5C13.0609 3.5 14.0783 3.92143 14.8284 4.67157C15.5786 5.42172 16 6.43913 16 7.5V10',
        width: 1.8,
        cap: true,
      },
    ],
  },
  dot: {
    viewBox: 20,
    paths: [
      {
        d: 'M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z',
        fill: true,
      },
    ],
  },
  send: {
    viewBox: 20,
    paths: [{ d: 'M10 15.8333V5M14.5833 9.58333L10 5L5.41667 9.58333', width: 2.2, cap: true, join: true }],
  },
  search: {
    viewBox: 18,
    paths: [
      {
        d: 'M8.25 13.125C10.9424 13.125 13.125 10.9424 13.125 8.25C13.125 5.55761 10.9424 3.375 8.25 3.375C5.55761 3.375 3.375 5.55761 3.375 8.25C3.375 10.9424 5.55761 13.125 8.25 13.125Z',
        width: 1.8,
      },
      { d: 'M12 12L15 15', width: 1.8, cap: true },
    ],
  },
} satisfies Record<string, IconSpec>;

export type IconName = keyof typeof icons;

export function Icon({ name, size, color = colors.label }: { name: IconName; size: number; color?: string }) {
  const spec: IconSpec = icons[name];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${spec.viewBox} ${spec.viewBox}`} fill="none">
      {spec.paths.map((p, i) => (
        <Path
          key={i}
          d={p.d}
          fill={p.fill ? color : 'none'}
          stroke={p.fill ? undefined : color}
          strokeWidth={p.width}
          strokeLinecap={p.cap ? 'round' : undefined}
          strokeLinejoin={p.join ? 'round' : undefined}
        />
      ))}
    </Svg>
  );
}
