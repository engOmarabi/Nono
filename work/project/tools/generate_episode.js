#!/usr/bin/env node
/**
 * حكايات الحقيبة — Episode Script Generator
 *
 * Usage:
 *   node generate_episode.js --data ../episodes_data/episode-09.json --out ../output
 *   node generate_episode.js --all     (generates every episode-*.json in ../episodes_data)
 *   node generate_episode.js --check   (validates every episode-*.json against SCHEMA.md,
 *                                        prints a report, generates nothing)
 *
 * Reads a single episode data file (see episodes_data/episode-XX.json for shape,
 * and episodes_data/SCHEMA.md for field docs) and produces a formatted, RTL,
 * landscape Word document identical in style to the hand-built originals.
 *
 * This is the file Claude Code should treat as the source of truth for episode
 * layout/formatting. To change how ALL episodes look, edit this file once.
 * To change ONE episode's content, edit its JSON data file — never hand-edit a
 * generated .docx.
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
  Header, Footer, PageNumber,
} = require("docx");
const fs = require("fs");
const path = require("path");

const RTL = true;
const FONT = "Arial";
const BRAND_COLOR = "8A5A2B";
const BOX_SHADE = "F3E9DA";

// ---------- low-level helpers ----------

function ar(text, opts = {}) {
  return new TextRun({ text, font: FONT, rightToLeft: RTL, ...opts });
}

function p(children, opts = {}) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    children: Array.isArray(children) ? children : [children],
    spacing: { after: 160, ...(opts.spacing || {}) },
    ...opts,
  });
}

function heading(text, level, opts = {}) {
  return new Paragraph({
    bidirectional: RTL,
    alignment: AlignmentType.RIGHT,
    heading: level,
    children: [ar(text, { bold: true, size: opts.size })],
    spacing: { before: 300, after: 160 },
  });
}

function labelValue(label, value) {
  return p([ar(label + "：", { bold: true, color: BRAND_COLOR }), ar(value)], { spacing: { after: 0 } });
}

function cell(children, opts = {}) {
  return new TableCell({
    width: opts.width || { size: 20, type: WidthType.PERCENTAGE },
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    verticalAlign: "center",
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: Array.isArray(children) ? children : [children],
  });
}

function headerCell(text) {
  return cell(
    p([ar(text, { bold: true, color: "FFFFFF", size: 20 })], { spacing: { after: 0 } }),
    { shading: BRAND_COLOR, width: { size: 20, type: WidthType.PERCENTAGE } }
  );
}

function tcCell(tc) {
  // Timecodes are LTR numeric ranges; force LTR so "mm:ss–mm:ss" doesn't reverse inside the RTL table.
  return new Paragraph({
    bidirectional: false,
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: tc, font: FONT, rightToLeft: false, bold: true, size: 18 })],
  });
}

function sceneRow(scene) {
  return new TableRow({
    children: [
      cell(tcCell(scene.timecode), { width: { size: 10, type: WidthType.PERCENTAGE } }),
      cell(p([ar(scene.visual, { size: 18 })], { spacing: { after: 0 } }), { width: { size: 35, type: WidthType.PERCENTAGE } }),
      cell(p([ar(scene.narration, { size: 18 })], { spacing: { after: 0 } }), { width: { size: 40, type: WidthType.PERCENTAGE } }),
      cell(p([ar(scene.music, { size: 18 })], { spacing: { after: 0 } }), { width: { size: 15, type: WidthType.PERCENTAGE } }),
    ],
  });
}

// ---------- document assembly ----------

function buildDocument(ep) {
  const sceneTableHeader = new TableRow({
    children: [headerCell("التوقيت"), headerCell("المشهد البصري"), headerCell("السرد (صوت الراوي)"), headerCell("الموسيقى / المؤثرات")],
  });

  const infoBoxRow = new TableRow({
    children: [
      cell(labelValue("المدة", ep.duration || "—"), { width: { size: 25, type: WidthType.PERCENTAGE }, shading: BOX_SHADE }),
      cell(labelValue("الموسم", ep.season || "—"), { width: { size: 25, type: WidthType.PERCENTAGE }, shading: BOX_SHADE }),
      cell(labelValue(ep.poetLabel || "الشاعر", ep.poetOrTopic || "—"), { width: { size: 25, type: WidthType.PERCENTAGE }, shading: BOX_SHADE }),
      cell(labelValue("الأسلوب البصري", ep.visualStyle || "—"), { width: { size: 25, type: WidthType.PERCENTAGE }, shading: BOX_SHADE }),
    ],
  });

  const body = [
    new Paragraph({
      bidirectional: RTL, alignment: AlignmentType.CENTER, spacing: { after: 60 },
      children: [ar("حكايات الحقيبة", { bold: true, size: 56, color: BRAND_COLOR })],
    }),
    new Paragraph({
      bidirectional: RTL, alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [ar(`الحلقة ${ep.number} — ${ep.shortTitle || ep.title}`, { bold: true, size: 32 })],
    }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [infoBoxRow] }),
    p([], { spacing: { after: 200 } }),
  ];

  // Editorial notes (0 or more; each becomes its own heading + paragraph)
  for (const note of ep.editorialNotes || []) {
    if (!note.heading || !note.body) continue;
    body.push(heading(note.heading, HeadingLevel.HEADING_2));
    body.push(p([ar(note.body)]));
  }

  body.push(heading("لوحة المشاهد (Storyboard النصي)", HeadingLevel.HEADING_2));
  body.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [sceneTableHeader, ...(ep.scenes || []).map(sceneRow)],
  }));
  body.push(p([], { spacing: { after: 200 } }));

  if (ep.quotedVerses && ep.quotedVerses.lines && ep.quotedVerses.lines.length) {
    body.push(heading("الأبيات المُستشهد بها", HeadingLevel.HEADING_2));
    if (ep.quotedVerses.note) {
      body.push(p([ar(ep.quotedVerses.note, { italics: true, color: "666666" })], { spacing: { after: 100 } }));
    }
    body.push(p([ar(ep.quotedVerses.lines.join(" — "), { bold: true })]));
  }

  if (ep.sources && ep.sources.length) {
    body.push(heading("مصادر الحلقة", HeadingLevel.HEADING_2));
    ep.sources.forEach((s, i) => {
      body.push(p([ar("• " + s)], { spacing: { after: i === ep.sources.length - 1 ? 160 : 60 } }));
    });
  }

  if (ep.productionNotes && ep.productionNotes.length) {
    body.push(heading("ملاحظات إنتاج", HeadingLevel.HEADING_2));
    ep.productionNotes.forEach((n, i) => {
      body.push(p([ar("— " + n)], { spacing: { after: i === ep.productionNotes.length - 1 ? 160 : 60 } }));
    });
  }

  return new Document({
    sections: [{
      properties: { page: { size: { width: 16838, height: 11906 }, orientation: "landscape" } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            bidirectional: RTL, alignment: AlignmentType.RIGHT,
            children: [ar(`حكايات الحقيبة — سيناريو الحلقة ${ep.number}`, { size: 16, color: BRAND_COLOR })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT] }), new TextRun(" / "), new TextRun({ children: [PageNumber.TOTAL_PAGES] })],
          })],
        }),
      },
      children: body,
    }],
  });
}

// ---------- validation (--check) ----------

// Fields SCHEMA.md documents as always required (editorialNotes may be an
// empty array and quotedVerses may be null, so those two are checked separately).
const REQUIRED_FIELDS = [
  "number", "title", "shortTitle", "slug", "duration", "season",
  "poetLabel", "poetOrTopic", "visualStyle",
];
const REQUIRED_SCENE_FIELDS = ["timecode", "visual", "narration", "music"];

function parseTimecode(tc) {
  const m = /^(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})$/.exec((tc || "").trim());
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  return { start, end };
}

function validateEpisode(ep, filename) {
  const problems = [];
  const tag = (msg) => problems.push(msg);

  for (const field of REQUIRED_FIELDS) {
    if (ep[field] === undefined || ep[field] === null || ep[field] === "") {
      tag(`missing/empty required field "${field}"`);
    }
  }

  if (ep.editorialNotes !== undefined && !Array.isArray(ep.editorialNotes)) {
    tag(`"editorialNotes" must be an array (found ${typeof ep.editorialNotes})`);
  } else {
    for (const [i, note] of (ep.editorialNotes || []).entries()) {
      if (!note.heading) tag(`editorialNotes[${i}] missing "heading"`);
      if (!note.body) tag(`editorialNotes[${i}] missing "body"`);
    }
  }

  if (!Array.isArray(ep.scenes) || ep.scenes.length === 0) {
    tag(`"scenes" must be a non-empty array`);
  } else {
    if (ep.scenes.length < 6 || ep.scenes.length > 8) {
      tag(`"scenes" has ${ep.scenes.length} entries (SCHEMA.md expects normally 6-8)`);
    }
    let prevEnd = null;
    ep.scenes.forEach((sc, i) => {
      for (const field of REQUIRED_SCENE_FIELDS) {
        if (!sc[field]) tag(`scenes[${i}] missing/empty "${field}"`);
      }
      const range = parseTimecode(sc.timecode);
      if (!range) {
        tag(`scenes[${i}] timecode "${sc.timecode}" is not in "mm:ss–mm:ss" format`);
        return;
      }
      if (range.start >= range.end) {
        tag(`scenes[${i}] timecode "${sc.timecode}" does not start before it ends`);
      }
      if (prevEnd !== null) {
        if (range.start < prevEnd) {
          tag(`scenes[${i}] timecode "${sc.timecode}" overlaps the previous scene (which ended at ${Math.floor(prevEnd / 60)}:${String(prevEnd % 60).padStart(2, "0")})`);
        } else if (range.start > prevEnd) {
          tag(`scenes[${i}] timecode "${sc.timecode}" leaves a gap after the previous scene (which ended at ${Math.floor(prevEnd / 60)}:${String(prevEnd % 60).padStart(2, "0")})`);
        }
      }
      prevEnd = range.end;
    });
  }

  if (ep.quotedVerses !== undefined && ep.quotedVerses !== null) {
    if (!Array.isArray(ep.quotedVerses.lines) || ep.quotedVerses.lines.length === 0) {
      tag(`"quotedVerses" is present but "lines" is missing/empty`);
    }
  }

  if (!Array.isArray(ep.sources) || ep.sources.length === 0) {
    tag(`"sources" must be a non-empty array`);
  }
  if (!Array.isArray(ep.productionNotes) || ep.productionNotes.length === 0) {
    tag(`"productionNotes" must be a non-empty array`);
  }

  return problems;
}

function checkAll(dataDir) {
  const files = fs.readdirSync(dataDir).filter(f => /^episode-\d+\.json$/.test(f)).sort();
  let totalProblems = 0;
  for (const f of files) {
    const filePath = path.join(dataDir, f);
    let ep;
    try {
      ep = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      console.log(`✗ ${f}`);
      console.log(`  - invalid JSON: ${e.message}`);
      totalProblems++;
      continue;
    }
    const problems = validateEpisode(ep, f);
    if (problems.length === 0) {
      console.log(`✓ ${f}`);
    } else {
      console.log(`✗ ${f}`);
      for (const p of problems) console.log(`  - ${p}`);
      totalProblems += problems.length;
    }
  }
  console.log("");
  console.log(totalProblems === 0
    ? `All ${files.length} episode files pass validation.`
    : `${totalProblems} problem(s) found across ${files.length} episode files.`);
  return totalProblems === 0;
}

// ---------- CLI ----------

function parseArgs(argv) {
  const args = { all: false, data: null, check: false, out: path.join(__dirname, "..", "output") };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--all") args.all = true;
    else if (argv[i] === "--data") args.data = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--check") args.check = true;
  }
  return args;
}

function slugifyTitle(ep) {
  // Uses the same short-title convention as the original hand-built files.
  return ep.shortTitle || ep.title.replace(/^الحلقة\s*\d+\s*—\s*/, "").split("(")[0].trim();
}

async function generateOne(dataPath, outDir) {
  const ep = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const doc = buildDocument(ep);
  const buf = await Packer.toBuffer(doc);
  fs.mkdirSync(outDir, { recursive: true });
  const slug = ep.slug || slugifyTitle(ep);
  const filename = `حلقة-${parseInt(ep.number, 10)}-${slug}.docx`;
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buf);
  console.log("✓", outPath);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.check) {
    const dataDir = path.join(__dirname, "..", "episodes_data");
    const ok = checkAll(dataDir);
    process.exit(ok ? 0 : 1);
  } else if (args.all) {
    const dataDir = path.join(__dirname, "..", "episodes_data");
    const files = fs.readdirSync(dataDir).filter(f => /^episode-\d+\.json$/.test(f));
    for (const f of files.sort()) {
      await generateOne(path.join(dataDir, f), args.out);
    }
  } else if (args.data) {
    await generateOne(args.data, args.out);
  } else {
    console.error("Usage: node generate_episode.js --data <episode.json> [--out <dir>]");
    console.error("   or: node generate_episode.js --all [--out <dir>]");
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
