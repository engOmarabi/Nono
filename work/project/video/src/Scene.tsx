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
import type { SceneRange } from "./timing";
import manifest from "../public/manifest.json";
import { ICONS } from "./icons";
import { SCENE_ICONS } from "./sceneVisuals";

// Amiri + Noto Sans Arabic are installed as system fonts in this environment
// (apt: fonts-hosny-amiri, fonts-noto-core) rather than loaded from Google
// Fonts, since this sandbox's network egress is allowlisted and doesn't
// include fonts.gstatic.com's TLS chain. Amiri fits the series' classical
// Arabic-poetry subject matter; Noto Sans Arabic is the fallback.
const fontFamily = "Amiri, 'Noto Sans Arabic', sans-serif";

// Same palette as tools/generate_episode.js (BRAND_COLOR / BOX_SHADE), so the
// video and the .docx scripts read as the same series.
const BRAND_COLOR = "#8A5A2B";
const BOX_SHADE = "#F3E9DA";

// One scene-art icon: scales/fades in (staggered when a scene has more than
// one), then floats gently in place for the rest of the scene so it never
// sits fully still.
function SceneIcon({
  iconKey,
  frame,
  delay,
  floatSeed,
}: {
  iconKey: keyof typeof ICONS;
  frame: number;
  delay: number;
  floatSeed: number;
}) {
  const Icon = ICONS[iconKey];
  const local = frame - delay;
  const scale = interpolate(local, [0, 18], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(local, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const floatY = Math.sin(frame / 40 + floatSeed) * 8;
  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale}) translateY(${floatY}px)`,
      }}
    >
      <Icon size={180} />
    </div>
  );
}

// Soft, slowly drifting blobs behind the text so a held scene never reads as
// a frozen slide — continuous motion for the entire scene duration, not just
// during the entrance.
function AmbientBackground({ frame, seed, duration }: { frame: number; seed: number; duration: number }) {
  const t = frame / Math.max(duration, 1);
  const blobs = [
    { baseX: 20, baseY: 25, size: 620, drift: 60, dir: 1 },
    { baseX: 78, baseY: 70, size: 520, drift: 50, dir: -1 },
    { baseX: 55, baseY: 15, size: 420, drift: 40, dir: 1 },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const phase = seed * 1.7 + i * 2.1;
        const x = b.baseX + Math.sin(t * Math.PI * 2 * b.dir + phase) * (b.drift / 20);
        const y = b.baseY + Math.cos(t * Math.PI * 2 * b.dir + phase) * (b.drift / 28);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%)",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

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
  const chromeOpacity = Math.min(entrance, exit);

  // Narration caption slides in a beat after the visual text starts, so the
  // two layers read as sequential motion rather than one flat fade.
  const captionDelay = 10;
  const captionLocal = Math.max(frame - captionDelay, 0);
  const captionEntrance = spring({
    frame: captionLocal,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const captionOpacity = Math.min(captionEntrance, exit);
  const captionTranslateY = interpolate(captionEntrance, [0, 1], [40, 0]);

  const icons = SCENE_ICONS[episodeNumber]?.[scene.index] ?? [];

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

      <AmbientBackground frame={frame} seed={scene.index} duration={scene.durationInFrames} />

      {/* timecode chip — forced LTR, matching the tcCell() convention in generate_episode.js.
          Physical `left`, not `insetInlineStart`: under this component's direction:rtl,
          the logical property would resolve to the right edge and collide with the
          episode label on the other side. */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 48,
          direction: "ltr",
          background: "rgba(0,0,0,0.25)",
          color: BOX_SHADE,
          padding: "8px 18px",
          borderRadius: 8,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 1,
          opacity: chromeOpacity,
        }}
      >
        {scene.timecode}
      </div>

      <div
        style={{
          position: "absolute",
          top: 40,
          right: 48,
          color: BOX_SHADE,
          fontSize: 26,
          opacity: chromeOpacity * 0.85,
        }}
      >
        حكايات الحقيبة — الحلقة {episodeNumber}
      </div>

      {/* Scene art: icon(s) standing in for illustrated/animated artwork (see
          icons.tsx / sceneVisuals.ts) — never the raw `visual` field, which is
          a director's note for an illustrator, not on-screen content. */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 48,
          flexDirection: "row",
        }}
      >
        {icons.map((key, i) => (
          <SceneIcon key={key} iconKey={key} frame={frame} delay={i * 8} floatSeed={scene.index * 1.3 + i} />
        ))}
      </AbsoluteFill>

      {/* narration caption — what the voice-over says for this scene */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
          left: 100,
          right: 100,
          background: "rgba(0,0,0,0.35)",
          color: "#ffffff",
          borderRadius: 14,
          padding: "22px 32px",
          fontSize: 30,
          lineHeight: 1.6,
          textAlign: "center",
          opacity: captionOpacity,
          transform: `translateY(${captionTranslateY}px)`,
        }}
      >
        {scene.narration}
      </div>

      {/* music cue label */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 48,
          color: BOX_SHADE,
          fontSize: 22,
          opacity: chromeOpacity * 0.75,
        }}
      >
        ♪ {scene.music}
      </div>
    </AbsoluteFill>
  );
};
