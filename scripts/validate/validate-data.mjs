import fs from "node:fs";

const root = new URL("../../", import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), "utf8").replace(/^\uFEFF/, "");
const fail = msg => { console.error("FAIL:", msg); process.exitCode = 1; };
const ok = msg => console.log("OK:", msg);

const byLines = read("data/hanja/normalized/by-reading.csv").trim().split(/\r?\n/);
const byRows = byLines.slice(1).filter(Boolean).map(line => {
  const p = line.split(",");
  return { reading:p[0], unicode:p[1], codepoint:p[2], hanja:p[3] };
});

const seen = new Set();
for (const r of byRows) {
  const key = `${r.reading}|${r.codepoint}`;
  if (seen.has(key)) fail(`duplicate reading relation: ${key}`);
  seen.add(key);
}
if (seen.size === byRows.length) ok(`no duplicate reading relations (${byRows.length})`);

const chLines = read("data/hanja/normalized/characters.csv").trim().split(/\r?\n/);
const chRows = chLines.slice(1).filter(Boolean).map(line => {
  const p = line.split(",");
  return { unicode:p[0], codepoint:p[1], hanja:p[2], readings:p[3] ? p[3].split("|") : [], reading_count:Number(p[4]) };
});

const chCodes = new Set();
for (const r of chRows) {
  if (chCodes.has(r.codepoint)) fail(`duplicate character codepoint: ${r.codepoint}`);
  chCodes.add(r.codepoint);
  if (r.readings.length !== r.reading_count) fail(`reading_count mismatch: ${r.codepoint}`);
}
ok(`unique character codepoints checked (${chRows.length})`);

const idx = JSON.parse(read("data/hanja/normalized/reading-index.json"));
const indexRelations = Object.values(idx.readings).reduce((n, arr) => n + arr.length, 0);
if (indexRelations !== byRows.length) fail(`reading-index relation count ${indexRelations} != by-reading ${byRows.length}`);
else ok(`reading-index relations match (${indexRelations})`);

const stats = JSON.parse(read("data/meta/dataset-stats.json"));
if (stats.hanja.normalized_reading_relations !== byRows.length) fail("dataset-stats normalized_reading_relations mismatch");
else ok("dataset-stats normalized relation count matches");

if (stats.hanja.unique_codepoints !== chRows.length) fail("dataset-stats unique_codepoints mismatch");
else ok("dataset-stats unique codepoint count matches");

const stems = read("data/myeongri/천간.csv").trim().split(/\r?\n/).length - 1;
const branches = read("data/myeongri/지지.csv").trim().split(/\r?\n/).length - 1;
const cycle = read("data/myeongri/육십갑자.csv").trim().split(/\r?\n/).length - 1;
const tenGod = read("data/myeongri/십성_천간100.csv").trim().split(/\r?\n/).length - 1;
if (stems !== 10) fail(`천간 count: ${stems}`); else ok("천간 10");
if (branches !== 12) fail(`지지 count: ${branches}`); else ok("지지 12");
if (cycle !== 60) fail(`육십갑자 count: ${cycle}`); else ok("육십갑자 60");
if (tenGod !== 100) fail(`십성 관계 count: ${tenGod}`); else ok("십성 천간 관계 100");

if (!process.exitCode) console.log("All integrity checks passed.");
