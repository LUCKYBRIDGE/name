import fs from "node:fs";

const root = new URL("../../", import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), "utf8").replace(/^\uFEFF/, "");
const fail = msg => { console.error("FAIL:", msg); process.exitCode = 1; };
const ok = msg => console.log("OK:", msg);

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
function csvRows(path) {
  const lines = read(path).trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map(line => {
    const vals = parseCsvLine(line);
    return Object.fromEntries(header.map((h,i)=>[h, vals[i] ?? ""]));
  });
}

// source registry
const sourceRows = csvRows("data/meta/sources.csv");
const sourceIds = new Set();
for (const r of sourceRows) {
  if (!r.source_id) fail("empty source_id");
  if (sourceIds.has(r.source_id)) fail(`duplicate source_id: ${r.source_id}`);
  sourceIds.add(r.source_id);
}
ok(`source registry unique IDs (${sourceIds.size})`);

// hanja normalization
const byRows = csvRows("data/hanja/normalized/by-reading.csv");
const seen = new Set();
for (const r of byRows) {
  const key = `${r.reading}|${r.codepoint}`;
  if (seen.has(key)) fail(`duplicate reading relation: ${key}`);
  seen.add(key);
}
if (seen.size === byRows.length) ok(`no duplicate reading relations (${byRows.length})`);

const chRows = csvRows("data/hanja/normalized/characters.csv");
const chCodes = new Set();
for (const r of chRows) {
  if (chCodes.has(r.codepoint)) fail(`duplicate character codepoint: ${r.codepoint}`);
  chCodes.add(r.codepoint);
  const readings = r.readings ? r.readings.split("|") : [];
  if (readings.length !== Number(r.reading_count)) fail(`reading_count mismatch: ${r.codepoint}`);
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

// myeongri fixed tables
const rowCount = p => read(p).trim().split(/\r?\n/).length - 1;
const stems = rowCount("data/myeongri/천간.csv");
const branches = rowCount("data/myeongri/지지.csv");
const cycle = rowCount("data/myeongri/육십갑자.csv");
const tenGod = rowCount("data/myeongri/십성_천간100.csv");
if (stems !== 10) fail(`천간 count: ${stems}`); else ok("천간 10");
if (branches !== 12) fail(`지지 count: ${branches}`); else ok("지지 12");
if (cycle !== 60) fail(`육십갑자 count: ${cycle}`); else ok("육십갑자 60");
if (tenGod !== 100) fail(`십성 관계 count: ${tenGod}`); else ok("십성 천간 관계 100");

// surname master and census
const surnameRows = csvRows("data/surnames/surnames.csv");
const surnameIds = new Set();
for (const r of surnameRows) {
  if (surnameIds.has(r.surname_id)) fail(`duplicate surname_id: ${r.surname_id}`);
  surnameIds.add(r.surname_id);
  for (const sid of (r.source_ids || "").split("|").filter(Boolean)) {
    if (!sourceIds.has(sid)) fail(`unknown surname source_id: ${sid}`);
  }
}
const xu = surnameRows.find(r => r.surname_id === "KR_SURNAME_U5F90");
if (!xu) fail("missing 徐 reference surname");
else {
  if (xu.hangul !== "서" || xu.hanja !== "徐" || xu.codepoint !== "U+05F90") fail("徐 identity mismatch");
  else ok("徐 surname identity matches");
  if (Number(xu.population_2015) !== 751704) fail("徐 2015 population mismatch");
  if (Number(xu.male_2015) + Number(xu.female_2015) !== Number(xu.population_2015)) fail("徐 sex totals mismatch");
  else ok("徐 2015 population totals match");
}

const clanRows = csvRows("data/surnames/clans-2015.csv");
const xuClanTotal = clanRows.filter(r => r.surname_id === "KR_SURNAME_U5F90").reduce((n,r)=>n+Number(r.population_2015),0);
if (xu && xuClanTotal !== Number(xu.population_2015)) fail(`徐 clan total ${xuClanTotal} != surname total ${xu.population_2015}`);
else if (xu) ok(`徐 clan totals match (${xuClanTotal})`);

// Xu pronunciation profile
const pronRows = csvRows("data/surnames/pronunciation-profiles.csv");
const xuPron = pronRows.find(r => r.surname_id === "KR_SURNAME_U5F90");
if (!xuPron) fail("missing 徐 pronunciation profile");
else {
  if (xuPron.hangul !== "서" || xuPron.onset !== "ㅅ" || xuPron.nucleus !== "ㅓ" || xuPron.coda !== "" || xuPron.syllable_shape !== "CV") fail("徐 pronunciation profile mismatch");
  else ok("徐 pronunciation profile matches CV open syllable");
  if (!sourceIds.has(xuPron.source_id)) fail(`unknown pronunciation source_id: ${xuPron.source_id}`);
}

// Xu stroke policy
const xuStroke = JSON.parse(read("data/surnames/entries/徐-strokes.json"));
if (xuStroke.references?.[0]?.count !== 10) fail("徐 technical stroke reference mismatch");
else ok("徐 technical stroke reference is 10");
if (xuStroke.numerology?.default_count !== null) fail("徐 numerology default_count must remain null until a method is registered");
else ok("徐 numerology default count correctly unset");
for (const ref of xuStroke.references || []) {
  if (ref.source_id && !sourceIds.has(ref.source_id)) fail(`unknown stroke source_id: ${ref.source_id}`);
}

// Xu clan-history evidence
const histRows = csvRows("data/surnames/clan-history.csv");
for (const r of histRows) {
  for (const sid of (r.source_ids || "").split("|").filter(Boolean)) {
    if (!sourceIds.has(sid)) fail(`unknown clan-history source_id: ${sid}`);
  }
  if (!r.evidence_level || !r.caveat) fail(`clan-history evidence metadata missing: ${r.bongwan}`);
}
if (histRows.filter(r => r.surname_id === "KR_SURNAME_U5F90").length !== 3) fail("徐 clan-history row count mismatch");
else ok("徐 clan-history evidence rows match");

// detailed Xu entry
const xuEntry = JSON.parse(read("data/surnames/entries/徐.json"));
if (xuEntry.pronunciation?.coda !== null || xuEntry.pronunciation?.syllable_shape !== "CV") fail("徐 detailed pronunciation mismatch");
if (xuEntry.stroke_policy?.numerology_default_count !== null) fail("徐 detailed numerology default must be null");
ok("徐 detailed profile guardrails checked");

// stats
if (stats.surnames?.master_records !== surnameRows.length) fail("dataset-stats surname record count mismatch");
else ok("dataset-stats surname record count matches");
if (stats.surnames?.pronunciation_profiles !== pronRows.length) fail("dataset-stats pronunciation profile count mismatch");
else ok("dataset-stats pronunciation profile count matches");
if (stats.surnames?.clan_history_rows !== histRows.length) fail("dataset-stats clan-history row count mismatch");
else ok("dataset-stats clan-history row count matches");

if (!process.exitCode) console.log("All integrity checks passed.");
