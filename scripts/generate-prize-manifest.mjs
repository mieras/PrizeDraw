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
    };
  });

  const outDir = path.dirname(OUT_MANIFEST);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${manifest.length} entries to ${OUT_MANIFEST}`);
}

main();
