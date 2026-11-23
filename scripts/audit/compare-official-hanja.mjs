import fs from "node:fs";
import { parseCsv } from "../build/lib/csv.mjs";

function readRelations(path) {
  const { header, rows } = parseCsv(fs.readFileSync(path, "utf8"));
  const readingColumn = header.includes("reading") ? "reading" : "legal_reading";
  if (!header.includes(readingColumn) || !header.includes("hanja") ||
      !["unicode", "codepoint"].some(column => header.includes(column))) {
    throw new Error("Missing required reading, hanja, or Unicode column");
  }
  if (!rows.length) throw new Error("CSV has no reading–Hanja records");

  const relations = new Map();
  const readingsByCodepoint = new Map();
  for (const [index, row] of rows.entries()) {
    const record = index + 2;
    const reading = row[readingColumn].trim().normalize("NFC");
    const hanja = row.hanja.trim();
    const unicodeValues = [row.codepoint?.trim(), row.unicode?.trim()].filter(Boolean);
    if (!/^[가-힣]$/u.test(reading)) {
      throw new Error(`CSV record ${record}: reading must be one Hangul syllable`);
    }
    if (!unicodeValues.length) throw new Error(`CSV record ${record}: missing Unicode code point`);
    for (const value of unicodeValues) {
      if (!/^(?:U\+)?[0-9a-f]{1,6}$/i.test(value)) {
        throw new Error(`CSV record ${record}: invalid Unicode code point ${value}`);
      }
      const code = Number.parseInt(value.replace(/^U\+/i, ""), 16);
      if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff) || String.fromCodePoint(code) !== hanja) {
        throw new Error(`CSV record ${record}: Unicode code point ${value} does not match Hanja ${hanja}`);
      }
    }

    const codepoint = `U+${hanja.codePointAt(0).toString(16).toUpperCase().padStart(5, "0")}`;
    const key = `${reading}|${codepoint}`;
    if (relations.has(key)) throw new Error(`CSV record ${record}: duplicate relation ${key}`);
    relations.set(key, row);
    if (!readingsByCodepoint.has(codepoint)) readingsByCodepoint.set(codepoint, new Set());
    readingsByCodepoint.get(codepoint).add(reading);
  }
  return { relations, readingsByCodepoint };
}

function compare(official, mirror) {
  const difference = (left, right) =>
    [...left.relations].filter(([key]) => !right.relations.has(key)).map(([, row]) => row);
  const officialOnly = difference(official, mirror);
  const mirrorOnly = difference(mirror, official);
  const readingMismatches = [];

  for (const [codepoint, readings] of official.readingsByCodepoint) {
    const mirrorReadings = mirror.readingsByCodepoint.get(codepoint);
    if (!mirrorReadings) continue;
    const officialSorted = [...readings].sort();
    const mirrorSorted = [...mirrorReadings].sort();
    if (officialSorted.join("|") !== mirrorSorted.join("|")) {
      readingMismatches.push({
        codepoint,
        official_readings: officialSorted,
        mirror_readings: mirrorSorted,
      });
    }
  }
  return {
    generated_at: new Date().toISOString(),
    comparison_key: "reading + Unicode codepoint",
    warning: "Do not compare the 2024 court headline count directly with normalized codepoint/relation counts; compare rows and legal categories.",
    counts: {
      official_relations: official.relations.size,
      mirror_relations: mirror.relations.size,
      common: official.relations.size - officialOnly.length,
      official_only: officialOnly.length,
      mirror_only: mirrorOnly.length,
      reading_mismatch_codepoints: readingMismatches.length,
    },
    official_only: officialOnly,
    mirror_only: mirrorOnly,
    reading_mismatches: readingMismatches,
  };
}

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node scripts/audit/compare-official-hanja.mjs <official-reading-character.csv> [output.json]");
  process.exit(2);
}

try {
  const official = readRelations(input);
  const mirrorPath = new URL("../../data/hanja/normalized/by-reading.csv", import.meta.url);
  const report = `${JSON.stringify(compare(official, readRelations(mirrorPath)), null, 2)}\n`;
  if (output) fs.writeFileSync(output, report, "utf8");
  else process.stdout.write(report);
} catch (error) {
  console.error(`Official Hanja comparison failed: ${error.message}`);
  process.exitCode = 1;
}
