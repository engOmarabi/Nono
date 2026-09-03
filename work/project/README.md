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

- Add a `--check` mode that validates every `episode-*.json` against
  `SCHEMA.md` (required fields present, `scenes` timecodes chronological,
  `sources`/`productionNotes` non-empty) and reports problems without
  generating anything — useful as a pre-commit hook.
- Add a `summary` command that regenerates the series index
  (`فهرس-السلسلة-الكامل.docx`) directly from `episodes_data/*.json` instead
  of the separate hand-maintained script that currently builds it, so the
  index can never drift out of sync with the episodes themselves.
- Consider an `episode.schema.json` (formal JSON Schema) generated from
  `SCHEMA.md` so validation and docs can't drift apart.
