import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseCsv, toCsv } from "../scripts/build/lib/csv.mjs";

const cli = fileURLToPath(new URL("../scripts/audit/compare-official-hanja.mjs", import.meta.url));
const header = "reading,hanja,unicode\n";

function runAudit(t, csv) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "official-hanja-audit-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, "input.csv");
  const output = path.join(directory, "report.json");
  fs.writeFileSync(input, csv);
  const result = spawnSync(process.execPath, [cli, input, output], { encoding: "utf8" });
  return { result, output };
}

test("CSV preserves quoted commas, quotes, newlines, and trailing whitespace", () => {
  const rows = [{ hanja: "伽", source: '문헌, "인용"\r\n다음 줄 ' }];
  const csv = toCsv(["hanja", "source"], rows, { bom: true });
  assert.deepEqual(parseCsv(csv), { header: ["hanja", "source"], rows });
  assert.throws(() => parseCsv('한자,출처\n伽,"끝나지 않음'), /unclosed quoted field/);
  assert.throws(() => parseCsv("한자,출처\n伽,문헌,추가"), /expected 2 fields/);
});

test("audit matches alternate Unicode spellings and keeps supplementary Hanja distinct", t => {
  const { result, output } = runAudit(t, `${header}가,伽, u+4f3d \n가,𠀀,20000\n`);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.equal(report.counts.common, 1);
  assert.deepEqual(report.official_only, [{ reading: "가", hanja: "𠀀", unicode: "20000" }]);
});

const invalidInputs = [
  ["header-only input", header, /no reading–Hanja records/],
  ["missing columns", "reading,hanja\n가,伽\n", /Missing required/],
  ["invalid Unicode", `${header}가,伽,INVALID\n`, /invalid Unicode code point/],
  ["out-of-range Unicode", `${header}가,伽,110000\n`, /does not match Hanja/],
  ["character mismatch", `${header}가,佳,4F3D\n`, /does not match Hanja/],
  ["invalid reading", `${header}가나,伽,4F3D\n`, /one Hangul syllable/],
  ["duplicate relation", `${header}가,伽,4F3D\n가,伽,U+04f3d\n`, /duplicate relation/],
  ["extra field", `${header}가,伽,4F3D,extra\n`, /expected 3 fields/],
];

for (const [name, csv, message] of invalidInputs) {
  test(`audit rejects ${name} without writing a report`, t => {
    const { result, output } = runAudit(t, csv);
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.equal(fs.existsSync(output), false);
  });
}
