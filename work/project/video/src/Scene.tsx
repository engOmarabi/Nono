import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Cairo";
import type { SceneRange } from "./timing";
import manifest from "../public/manifest.json";

const { fontFamily } = loadFont();

// Same palette as tools/generate_episode.js (BRAND_COLOR / BOX_SHADE), so the
// video and the .docx scripts read as the same series.
const BRAND_COLOR = "#8A5A2B";
const BOX_SHADE = "#F3E9DA";
const INK = "#2A1D10";

export const Scene: React.FC<{ scene: SceneRange; episodeNumber: string }> = ({
  scene,
  episodeNumber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const exitStart = scene.durationInFrames - 15;
  const exit =
    frame > exitStart
      ? interpolate(frame, [exitStart, scene.durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const opacity = Math.min(entrance, exit);
  const translateY = interpolate(entrance, [0, 1], [24, 0]);

  const narrationSrc = manifest.narration[String(scene.index + 1)];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${BRAND_COLOR} 0%, #6b431f 100%)`,
        fontFamily,
        direction: "rtl",
      }}
    >
      {narrationSrc ? <Audio src={staticFile(narrationSrc)} /> : null}

      {/* timecode chip — forced LTR, matching the tcCell() convention in generate_episode.js */}
      <div
        style={{
          position: "absolute",
          top: 40,
          insetInlineStart: 48,
          direction: "ltr",
          background: "rgba(0,0,0,0.25)",
          color: BOX_SHADE,
          padding: "8px 18px",
          borderRadius: 8,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {scene.timecode}
      </div>

      <div
        style={{
          position: "absolute",
          top: 40,
          insetInlineEnd: 48,
          color: BOX_SHADE,
          fontSize: 26,
          opacity: 0.85,
        }}
      >
        حكايات الحقيبة — الحلقة {episodeNumber}
      </div>

      {/* primary "visual" description — stands in for illustrated scene art in this PoC */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 160px",
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            color: BOX_SHADE,
            fontSize: 40,
            lineHeight: 1.6,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {scene.visual}
        </div>
      </AbsoluteFill>

      {/* narration caption — what the voice-over says for this scene */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
          insetInlineStart: 100,
          insetInlineEnd: 100,
          background: "rgba(0,0,0,0.35)",
          color: "#ffffff",
          borderRadius: 14,
          padding: "22px 32px",
          fontSize: 30,
          lineHeight: 1.6,
          textAlign: "center",
          opacity,
        }}
      >
        {scene.narration}
      </div>

      {/* music cue label */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          insetInlineStart: 48,
          color: BOX_SHADE,
          fontSize: 22,
          opacity: 0.75,
        }}
      >
        ♪ {scene.music}
      </div>
    </AbsoluteFill>
  );
};
