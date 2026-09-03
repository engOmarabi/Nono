# Episode data schema

Each `episode-XX.json` describes one episode. `tools/generate_episode.js` reads
this file and produces the formatted `.docx`. **Edit the JSON to change an
episode's content — never hand-edit the generated `.docx`.**

## Fields

| Field | Type | Notes |
|---|---|---|
| `number` | string | Episode number as it appears on screen, e.g. `"9"`. |
| `title` | string | Full title incl. "الحلقة N — " prefix, as originally generated. Kept for reference; the doc is built from `shortTitle`. |
| `shortTitle` | string | Title without the "الحلقة N — " prefix. Shown after the episode number on the title page. |
| `slug` | string | Filename fragment (no extension), Arabic, hyphen-separated. Output file is `حلقة-{number}-{slug}.docx`. Keep stable once shared with anyone. |
| `duration` | string | e.g. `"≈ 4 دقائق"` or `"≈ 3:45 دقائق"`. Free text, shown as-is. |
| `season` | string | e.g. `"الموسم 2 — قصص الغزل الكلاسيكية"`. |
| `poetLabel` | string | The label shown before `poetOrTopic` in the info box — usually `"الشاعر"`, sometimes `"الموضوع"` or `"الشخصية المحورية"` for non-poet-centered episodes. |
| `poetOrTopic` | string | The value shown next to `poetLabel`. |
| `visualStyle` | string | Free text describing the animation/visual approach for the episode. |
| `editorialNotes` | array of `{heading, body}` | Zero or more editorial/production-context notes rendered as `Heading 2` + paragraph, appearing after the info box and before the storyboard table. Use this for corrections, sourcing caveats, replacement-episode notices, etc. — every substantive judgment call belongs here, not buried in scene text. |
| `scenes` | array of `{timecode, visual, narration, music}` | The storyboard table, one row per scene. `timecode` is a plain string like `"00:00–00:20"` — always start→end chronological order (the generator forces LTR rendering so digits don't reverse inside the RTL table; you do not need to reverse them yourself). |
| `quotedVerses` | `{note, lines}` or `null` | `lines` is an array of short quoted-verse strings (already wrapped in «»); rendered on one line separated by " — ". `note` is optional italic caption above the quote, typically explaining that only a short excerpt is used. Omit entirely (`null`) for episodes with no verse citation. |
| `sources` | array of strings | Rendered as a bulleted list under "مصادر الحلقة". Do not include the leading "• " — the generator adds it. |
| `productionNotes` | array of strings | Rendered as a bulleted list under "ملاحظات إنتاج". Do not include the leading "— " — the generator adds it. |

## Adding a new episode

1. Copy an existing `episode-XX.json` as a starting template.
2. Fill in every field. `scenes` should normally be 6–8 entries covering a
   3–6 minute episode (see existing files for pacing).
3. Run:
   ```
   node tools/generate_episode.js --data episodes_data/episode-18.json --out output
   ```
4. Convert to PDF and spot-check rendering before sharing (RTL table layouts
   are easy to get subtly wrong — see the "Known gotchas" section in the main
   README).

## Regenerating everything

```
node tools/generate_episode.js --all --out output
```

This is useful after changing `tools/generate_episode.js` itself (e.g. a
formatting/branding change that should apply to all episodes at once) — the
whole series regenerates from data, so there's never a risk of episodes
drifting out of visual sync with each other.
