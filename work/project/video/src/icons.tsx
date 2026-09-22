import React from "react";

// Small hand-drawn line-art icon set standing in for the illustrated/animated
// artwork a real production would commission for each scene. Chosen instead
// of AI image generation because that requires enabling real billing on the
// Google account behind the Gemini key (see README "Video pipeline"); these
// are free, zero-network, and match the project's own rule of never
// depicting historical figures' faces realistically (silhouettes/symbols
// only, per productionNotes across the series).
//
// Each icon is a plain stroke-based SVG, sized to a 200x200 viewBox, colored
// via `color`/`accent` props so it fits the episode's palette.

type IconProps = { color?: string; accent?: string; size?: number };

const DEFAULT_COLOR = "#F3E9DA";
const DEFAULT_ACCENT = "#D8A857";

export const SuitcaseClosedIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <rect x="35" y="70" width="130" height="90" rx="10" stroke={color} strokeWidth="6" />
    <path d="M78 70 V52a12 12 0 0 1 12-12h20a12 12 0 0 1 12 12v18" stroke={color} strokeWidth="6" strokeLinecap="round" />
    <line x1="35" y1="110" x2="165" y2="110" stroke={color} strokeWidth="4" opacity="0.6" />
    <rect x="92" y="100" width="16" height="20" rx="3" stroke={color} strokeWidth="5" />
  </svg>
);

export const SuitcaseOpenIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, accent = DEFAULT_ACCENT, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <rect x="30" y="110" width="140" height="55" rx="8" stroke={color} strokeWidth="6" />
    <path d="M35 110 L60 60 H140 L165 110" stroke={color} strokeWidth="6" strokeLinejoin="round" />
    <path d="M75 60 V45a10 10 0 0 1 10-10h30a10 10 0 0 1 10 10v15" stroke={color} strokeWidth="5" strokeLinecap="round" />
    <circle cx="100" cy="88" r="5" fill={accent} />
    <circle cx="80" cy="95" r="3" fill={accent} opacity="0.7" />
    <circle cx="120" cy="95" r="3" fill={accent} opacity="0.7" />
  </svg>
);

export const RadioTowerIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <path d="M100 40 L70 170 H130 L100 40 Z" stroke={color} strokeWidth="5" strokeLinejoin="round" />
    <line x1="82" y1="100" x2="118" y2="100" stroke={color} strokeWidth="4" />
    <line x1="76" y1="135" x2="124" y2="135" stroke={color} strokeWidth="4" />
    <circle cx="100" cy="40" r="6" fill={color} />
    <path d="M75 55 A40 40 0 0 0 55 90" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    <path d="M60 45 A65 65 0 0 0 30 95" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.45" />
    <path d="M125 55 A40 40 0 0 1 145 90" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    <path d="M140 45 A65 65 0 0 1 170 95" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const WaveformIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, size = 200 }) => {
  const heights = [30, 55, 90, 60, 100, 70, 40, 85, 50, 65, 35];
  const barWidth = 10;
  const gap = 6;
  const totalWidth = heights.length * (barWidth + gap) - gap;
  const startX = (200 - totalWidth) / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={startX + i * (barWidth + gap)}
          y={100 - h / 2}
          width={barWidth}
          height={h}
          rx={barWidth / 2}
          fill={color}
          opacity={0.55 + (h / 100) * 0.45}
        />
      ))}
    </svg>
  );
};

export const PersonBackIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <circle cx="100" cy="55" r="26" fill={color} opacity="0.9" />
    <path
      d="M55 165 C55 115 70 95 100 95 C130 95 145 115 145 165"
      fill={color}
      opacity="0.9"
    />
  </svg>
);

export const MicrophoneIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <rect x="80" y="30" width="40" height="80" rx="20" stroke={color} strokeWidth="6" />
    <path d="M60 90 a40 40 0 0 0 80 0" stroke={color} strokeWidth="6" strokeLinecap="round" />
    <line x1="100" y1="130" x2="100" y2="160" stroke={color} strokeWidth="6" strokeLinecap="round" />
    <line x1="70" y1="160" x2="130" y2="160" stroke={color} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const MusicNotesIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <circle cx="60" cy="150" r="16" fill={color} />
    <circle cx="140" cy="135" r="16" fill={color} />
    <line x1="76" y1="150" x2="76" y2="60" stroke={color} strokeWidth="5" />
    <line x1="156" y1="135" x2="156" y2="50" stroke={color} strokeWidth="5" />
    <path d="M76 60 L156 50 V75 L76 85 Z" fill={color} />
  </svg>
);

export const RainWindowIcon: React.FC<IconProps> = ({ color = DEFAULT_COLOR, accent = DEFAULT_ACCENT, size = 200 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <rect x="40" y="35" width="120" height="110" rx="8" stroke={color} strokeWidth="6" />
    <line x1="100" y1="35" x2="100" y2="145" stroke={color} strokeWidth="4" opacity="0.6" />
    <line x1="40" y1="90" x2="160" y2="90" stroke={color} strokeWidth="4" opacity="0.6" />
    {[
      [60, 160],
      [90, 172],
      [120, 160],
      [145, 170],
    ].map(([x, y], i) => (
      <line key={i} x1={x} y1={y - 14} x2={x - 6} y2={y} stroke={accent} strokeWidth="4" strokeLinecap="round" />
    ))}
  </svg>
);

export const ICONS = {
  suitcaseClosed: SuitcaseClosedIcon,
  suitcaseOpen: SuitcaseOpenIcon,
  radioTower: RadioTowerIcon,
  waveform: WaveformIcon,
  personBack: PersonBackIcon,
  microphone: MicrophoneIcon,
  musicNotes: MusicNotesIcon,
  rainWindow: RainWindowIcon,
} as const;

export type IconKey = keyof typeof ICONS;
