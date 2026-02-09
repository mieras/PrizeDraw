import fs from "node:fs";
import path from "node:path";

const OUT_MANIFEST = "./src/prizes/manifest.json";
const WIDTH = 400;
const HEIGHT = 300;

// CSV column indices (0-based)
const COL_TITLE = 4;
const COL_LIDWOORD = 5;
const COL_OMSCHRIJVING_FULL = 6;
const COL_OMSCHRIJVING_KORT = 9;
const COL_UITSLAG_TITLE = 10;
const COL_IMAGE_URL = 12;

const VALUE_RULES = [
  { pattern: /superpostcodeprijs|1\s*miljoen|€\s*1\.?000\.?000/i, value: 10 },
  { pattern: /10\s*jaar.*25\.?000|25\.?000.*per jaar/i, value: 9.4 },
  { pattern: /\bbmw\b|naar keuze.*bmw/i, value: 8.6 },
  { pattern: /playstation|ps5/i, value: 7.5 },
  { pattern: /dyson/i, value: 7.1 },
  { pattern: /€\s*500|shoptegoed.*500/i, value: 6.4 },
  { pattern: /geldprijs.*1\.?000|€\s*1\.?000/i, value: 6.1 },
  { pattern: /garmin|smartwatch/i, value: 5.7 },
  { pattern: /fiets|roetz/i, value: 5.2 },
  { pattern: /reiskofferset|reiskoffer/i, value: 4.5 },
  { pattern: /giftcard|cadeaukaart|shoptegoed.*20|rituals/i, value: 0.5 },
  { pattern: /boek|film|tijdschrift|plant/i, value: 1.8 },
  { pattern: /sokken|keukentextiel|ovenschaal|paraplu|jbl|speaker|chocolade/i, value: 1.5 },
  { pattern: /lokaal verscadeaukaart|bakkerscadeaukaart/i, value: 0.8 },
  { pattern: /hema.*5|cadeaukaart.*5/i, value: 0.5 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function inferRevealValue(entry) {
  const text = [entry.title, entry.omschrijvingFull, entry.omschrijvingKort, entry.uitslagTitle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const rule of VALUE_RULES) {
    if (rule.pattern.test(text)) {
      return clamp(rule.value, 0.5, 10);
    }
  }

  return 1.5;
}

/**
 * Parse semicolon-separated CSV with quoted fields (handles newlines inside quotes).
 * Strips BOM from first field.
 */
function parseCsvRows(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const trimBom = (s) => s.replace(/^\uFEFF/, "");

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ";") {
      row.push(trimBom(field));
      field = "";
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++;
      row.push(trimBom(field));
      field = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    field += c;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(trimBom(field));
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }
  return rows;
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node generate-prize-manifest.mjs <path-to-csv>");
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsvRows(raw);
  if (rows.length < 3) {
    console.error("CSV has no data rows");
    process.exit(1);
  }

  // Skip first row (sep=;) and header row
  const dataRows = rows.slice(2);
  const seen = new Set();
  const entries = [];

  for (const row of dataRows) {
    const imageUrl = (row[COL_IMAGE_URL] ?? "").trim();
    if (!imageUrl.startsWith("http") || seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    const title = (row[COL_TITLE] ?? "").trim();
    const lidwoord = (row[COL_LIDWOORD] ?? "").trim();
    const omschrijvingFull = (row[COL_OMSCHRIJVING_FULL] ?? "").trim();
    const omschrijvingKort = (row[COL_OMSCHRIJVING_KORT] ?? "").trim();
    const uitslagTitle = (row[COL_UITSLAG_TITLE] ?? "").trim();

    entries.push({
      title,
      lidwoord,
      omschrijvingFull,
      omschrijvingKort,
      uitslagTitle,
    });
  }

  const manifest = entries.map((entry, index) => {
    const num = String(index + 1).padStart(3, "0");
    const ext = "png"; // public/prizes uses .png
    return {
      url: `/prizes/prize-${num}.${ext}`,
      width: WIDTH,
      height: HEIGHT,
      title: entry.title,
      lidwoord: entry.lidwoord,
      omschrijvingKort: entry.omschrijvingKort,
      omschrijvingFull: entry.omschrijvingFull,
      uitslagTitle: entry.uitslagTitle,
      revealValue: inferRevealValue(entry),
    };
  });

  const outDir = path.dirname(OUT_MANIFEST);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${manifest.length} entries to ${OUT_MANIFEST}`);
}

main();
