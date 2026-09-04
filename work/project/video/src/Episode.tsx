import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { useVideoConfig } from "remotion";
import { Scene } from "./Scene";
import { buildSceneRanges } from "./timing";
import manifest from "../public/manifest.json";
import type { EpisodeData } from "./Root";

export const Episode: React.FC<{ episode: EpisodeData }> = ({ episode }) => {
  const { fps } = useVideoConfig();
  const ranges = buildSceneRanges(episode.scenes, fps);

  return (
    <>
      {manifest.music ? (
        <Audio src={staticFile(manifest.music)} volume={0.18} loop />
      ) : null}
      <Series>
        {ranges.map((scene) => (
          <Series.Sequence key={scene.index} durationInFrames={scene.durationInFrames}>
            <Scene scene={scene} episodeNumber={episode.number} />
          </Series.Sequence>
        ))}
      </Series>
    </>
  );
};
