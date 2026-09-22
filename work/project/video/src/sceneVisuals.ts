import type { IconKey } from "./icons";

// Maps each episode's scenes to the icon(s) that stand in for its
// illustrated/animated artwork (see icons.tsx for why: no AI image
// generation without enabling real billing). One entry per scene, in order.
// Add an entry here whenever a new episode is wired into Root.tsx.
export const SCENE_ICONS: Record<string, IconKey[][]> = {
  "1": [
    ["suitcaseClosed"], // 00:00–00:20 — opening titles, closed suitcase
    ["suitcaseClosed", "radioTower"], // 00:20–01:00 — carried to the radio station
    ["waveform", "personBack"], // 01:00–01:40 — old recording plays, man from behind
    ["microphone", "rainWindow"], // 01:40–02:30 — BBC Arabic studio, London rain
    ["microphone", "musicNotes"], // 02:30–03:10 — re-recording session, singers + band
    ["suitcaseOpen"], // 03:10–03:45 — the real newsroom suitcase, opened
    ["suitcaseClosed"], // 03:45–04:15 — closing identity
  ],
};
