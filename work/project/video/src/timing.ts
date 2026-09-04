// Converts the "mm:ss–mm:ss" timecode strings used in episodes_data/*.json
// (see SCHEMA.md: "scenes") into frame ranges for a given fps.

export type Scene = {
  timecode: string;
  visual: string;
  narration: string;
  music: string;
};

export type SceneRange = Scene & {
  index: number;
  startFrame: number;
  durationInFrames: number;
};

function parseTimecode(tc: string): { startSec: number; endSec: number } {
  const match = /^(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})$/.exec(tc.trim());
  if (!match) {
    throw new Error(`Unrecognized timecode format: "${tc}"`);
  }
  const [, sm, ss, em, es] = match;
  return {
    startSec: Number(sm) * 60 + Number(ss),
    endSec: Number(em) * 60 + Number(es),
  };
}

export function buildSceneRanges(scenes: Scene[], fps: number): SceneRange[] {
  return scenes.map((scene, index) => {
    const { startSec, endSec } = parseTimecode(scene.timecode);
    return {
      ...scene,
      index,
      startFrame: Math.round(startSec * fps),
      durationInFrames: Math.round((endSec - startSec) * fps),
    };
  });
}

export function totalDurationInFrames(scenes: Scene[], fps: number): number {
  const ranges = buildSceneRanges(scenes, fps);
  const last = ranges[ranges.length - 1];
  return last.startFrame + last.durationInFrames;
}
