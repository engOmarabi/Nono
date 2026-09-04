#!/usr/bin/env node
// Scans public/audio and public/music for files that actually exist and
// writes public/manifest.json, so Scene.tsx never references a missing
// asset (narration/music are added incrementally as TTS/tracks arrive).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const audioDir = path.join(publicDir, "audio");
const musicDir = path.join(publicDir, "music");

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(mp3|wav|m4a)$/i.test(f));
}

const narration = {};
for (const file of listFiles(audioDir)) {
  const match = /^scene-(\d+)\./.exec(file);
  if (match) narration[match[1]] = `audio/${file}`;
}

const musicFiles = listFiles(musicDir);
const music = musicFiles.length > 0 ? `music/${musicFiles[0]}` : null;

const manifest = { narration, music };
fs.writeFileSync(
  path.join(publicDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);
console.log("wrote public/manifest.json:", manifest);
