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


const surnameLines = read("data/surnames/surnames.csv").trim().split(/\r?\n/);
const surnameRows = surnameLines.slice(1).filter(Boolean).map(line => {
  const p = line.split(",");
  return {
    surname_id:p[0], hangul:p[1], hanja:p[2], codepoint:p[4],
    population_2015:Number(p[9]), male_2015:Number(p[10]), female_2015:Number(p[11])
  };
});
const surnameIds = new Set();
for (const r of surnameRows) {
  if (surnameIds.has(r.surname_id)) fail(`duplicate surname_id: ${r.surname_id}`);
  surnameIds.add(r.surname_id);
}
const xu = surnameRows.find(r => r.surname_id === "KR_SURNAME_U5F90");
if (!xu) fail("missing 徐 reference surname");
else {
  if (xu.hangul !== "서" || xu.hanja !== "徐" || xu.codepoint !== "U+05F90") fail("徐 identity mismatch");
  else ok("徐 surname identity matches");
  if (xu.population_2015 !== 751704) fail("徐 2015 population mismatch");
  if (xu.male_2015 + xu.female_2015 !== xu.population_2015) fail("徐 sex totals mismatch");
  else ok("徐 2015 population totals match");
}

const clanLines = read("data/surnames/clans-2015.csv").trim().split(/\r?\n/);
const clanRows = clanLines.slice(1).filter(Boolean).map(line => {
  const p = line.split(",");
  return { surname_id:p[0], bongwan:p[1], population_2015:Number(p[2]) };
});
const xuClanTotal = clanRows.filter(r => r.surname_id === "KR_SURNAME_U5F90").reduce((n,r)=>n+r.population_2015,0);
if (xu && xuClanTotal !== xu.population_2015) fail(`徐 clan total ${xuClanTotal} != surname total ${xu.population_2015}`);
else if (xu) ok(`徐 clan totals match (${xuClanTotal})`);

if (stats.surnames?.master_records !== surnameRows.length) fail("dataset-stats surname record count mismatch");
else ok("dataset-stats surname record count matches");
