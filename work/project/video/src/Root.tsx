import React from "react";
import { Composition } from "remotion";
import { Episode } from "./Episode";
import { totalDurationInFrames, type Scene as SceneData } from "./timing";
import episode01 from "../../episodes_data/episode-01.json";

export type EpisodeData = {
  number: string;
  shortTitle: string;
  scenes: SceneData[];
};

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  const durationInFrames = totalDurationInFrames(episode01.scenes, FPS);

  return (
    <Composition
      id="Episode"
      component={Episode}
      durationInFrames={durationInFrames}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ episode: episode01 as EpisodeData }}
    />
  );
};
