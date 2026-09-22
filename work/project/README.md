# حكايات الحقيبة — Episode Script Pipeline

Data-driven pipeline for generating the "حكايات الحقيبة" video series scripts
as formatted Word documents. Built after 17 episodes were hand-authored one
JS file at a time; this restructures that work into data + one generator, so
future episodes are a JSON file, not a copy-pasted script.

## Layout

```
episodes_data/
  SCHEMA.md          ← field-by-field docs, read this first
  episode-01.json     ...through episode-17.json
tools/
  generate_episode.js ← the only file that controls formatting/layout
output/                ← generated .docx files land here (gitignored)
video/                 ← Remotion PoC: renders an episode-*.json into an .mp4 (see below)
```

## Quick start

```
npm install docx
node tools/generate_episode.js --all --out output
```

Generates all 17 episodes fresh from `episodes_data/`. Individual episode:

```
node tools/generate_episode.js --data episodes_data/episode-05.json --out output
```

## Design principles (read before changing anything)

- **Content lives in JSON, layout lives in `generate_episode.js`.** If a
  correction is needed to what an episode *says*, edit its JSON. If the fix
  is about how *every* episode looks (fonts, table widths, page size), edit
  the generator once — all 17 pick it up automatically on next `--all` run.
- **RTL/timecode gotcha**: table cells default to right-to-left Arabic
  paragraphs. Timecodes are plain LTR number ranges and are force-rendered
  LTR (`tcCell()` in the generator) so `"00:20–01:00"` doesn't visually
  reverse inside an RTL table. If you add any other LTR content (dates,
  numeric IDs) to a cell, route it through the same pattern rather than the
  default `ar()`/`p()` helpers.
- **Every episode's editorial judgment calls are in `editorialNotes`, not
  buried in scene narration.** Corrections to the original season plan,
  sourcing caveats, sensitive-topic handling decisions, "this needs a second
  source before production" flags — all go there, in plain prose, so a human
  producer reviewing the doc sees them immediately under the info box.
- **Sources are per-episode, not centralized**, because a claim's citation
  needs to travel with the claim when scripts get revised independently.

## Video pipeline (proof of concept)

`video/` is a separate Remotion project that renders one episode's JSON
straight into a narrated `.mp4` — the same source-of-truth `episodes_data/*.json`
files, a second consumer. It does not touch `tools/generate_episode.js` or
the `.docx` output.

```
video/
  src/timing.ts        ← parses "mm:ss–mm:ss" into frame ranges (fps=30)
  src/Scene.tsx         ← one scene = art (image or icon) + narration caption + timecode chip
  src/Episode.tsx        ← <Series> of scenes + optional background music bed
  src/Root.tsx            ← registers the "Episode" composition (currently wired to episode-01.json)
  src/sceneImages.ts       ← per-scene generated illustration, keyed by episode number
  src/sceneVisuals.ts       ← per-scene icon fallback (src/icons.tsx) for scenes with no image yet
  scripts/generate_narration.py ← calls Gemini TTS per scene, writes public/audio/scene-N.wav
  scripts/generate-manifest.mjs ← scans public/audio + public/music, writes public/manifest.json
  public/images/                ← generated scene illustrations (committed — see note below)
  public/manifest.json          ← which narration/music files actually exist (gitignored, regenerated)
```

Quick start:

```
cd video
npm install
GEMINI_API_KEY=... python3 scripts/generate_narration.py ../episodes_data/episode-01.json
npm run render        # runs the manifest script, then renders out/episode.mp4
```

**Design notes / environment-specific choices (read before changing):**

- **Narration is Gemini's native TTS** (`gemini-2.5-flash-preview-tts`, model
  `Kore` voice), called directly over HTTPS with a plain API key
  (`x-goog-api-key`/`?key=`) — not the older Cloud Text-to-Speech API, which
  in this project's GCP org requires OAuth/service-account credentials
  instead of a simple key. Get a key at aistudio.google.com, not
  console.cloud.google.com.
- **Fonts are local, not Google Fonts.** `Scene.tsx` sets `fontFamily` to
  `Amiri, 'Noto Sans Arabic', sans-serif` (installed via
  `apt install fonts-hosny-amiri fonts-noto-core`) instead of
  `@remotion/google-fonts/Cairo`, because this environment's network egress
  is allowlisted and doesn't include `fonts.gstatic.com`'s cert chain. If you
  render somewhere with normal internet access, either font strategy works —
  keep this one for portability unless you have a reason not to.
- **Chromium**: `remotion.config.ts` points `browserExecutable` at this
  environment's pre-installed headless shell instead of letting Remotion
  download its own (the default download host isn't in the network
  allowlist here). On a machine with normal internet access, delete that
  config line and Remotion will download its own Chromium on first render.
- **Scene art is never the raw `visual` field.** That field is a director's
  note for an illustrator (e.g. "شارة افتتاحية... حقيبة سوداء قديمة تظهر في
  المنتصف"), not on-screen content — rendering it as literal text made early
  drafts of this PoC look like storyboard notes, not video. `Scene.tsx` shows
  a real generated illustration from `public/images/` when `sceneImages.ts`
  has one for that scene, falling back to a hand-drawn icon (`icons.tsx` /
  `sceneVisuals.ts`) otherwise. AI image generation from inside this sandbox
  was tried first (`gemini-3.1-flash-image`, same key as the TTS call) but
  its free-tier quota is 0 — it requires enabling real billing, which the
  project owner declined. The episode-01 illustrations were instead
  generated externally (Bing Image Creator, free, no API key) from prompts
  derived from each scene's `visual` field, downloaded, and committed here —
  they're real assets, not a regenerable build artifact, so unlike the audio
  they are **not** gitignored (the project `.gitignore`'s blanket `*.jpg`
  rule has a `!video/public/images/*.jpg` exception for this).
- **Background music is not wired up yet.** `Episode.tsx` already supports it
  (`public/manifest.json.music`, looped under the narration) — it's a matter
  of dropping a royalty-free track (Pixabay Music / YouTube Audio Library)
  into `public/music/` and re-running `npm run manifest`. Both of those
  sites were unreachable from this sandbox at the time of the PoC, so this
  step is left for an environment with normal internet access.
- **Generated audio/video are gitignored** (`public/audio/*.wav`,
  `public/manifest.json`, `out/`), same principle as `output/*.docx` in the
  main pipeline: only source is committed, artifacts are regenerated.

## Known gotchas (hit during original authoring)

- Nested straight quotes inside a JS string literal break `eval`/`require` —
  this pipeline sidesteps that entirely by keeping content in JSON, but if
  you ever hand-edit `generate_episode.js`, watch for the same issue in any
  inline string literals you add.
- LibreOffice's `soffice.py --headless --convert-to pdf` (see
  `/mnt/skills/public/docx/SKILL.md` if working in that environment) is the
  fastest way to visually verify a render before sharing — always check
  page 1 of a new/changed episode before treating it as done.

## Suggested next steps for Claude Code

- ~~Add a `--check` mode...~~ done — `node tools/generate_episode.js --check`
  validates every `episode-*.json` against `SCHEMA.md` (required fields,
  chronological scene timecodes, non-empty `sources`/`productionNotes`)
  without generating anything.
- Source a background-music bed per episode and wire it into
  `video/public/music/` (see "Video pipeline" above — blocked in the PoC's
  sandbox, not a code limitation).
- Extend `video/src/Root.tsx` to render any `episode-*.json`, not just
  episode 1, once the visual/narration/music approach is approved for the
  full series.
- Add a `summary` command that regenerates the series index
  (`فهرس-السلسلة-الكامل.docx`) directly from `episodes_data/*.json` instead
  of the separate hand-maintained script that currently builds it, so the
  index can never drift out of sync with the episodes themselves.
- Consider an `episode.schema.json` (formal JSON Schema) generated from
  `SCHEMA.md` so validation and docs can't drift apart.
