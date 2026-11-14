import fs from "node:fs";

const root = new URL("../../", import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), "utf8").replace(/^\uFEFF/, "");
const exists = p => fs.existsSync(new URL(p, root));
const fail = msg => { console.error("FAIL:", msg); process.exitCode = 1; };
const ok = msg => console.log("OK:", msg);

function parseCsvLine(line) {
  const out=[]; let cur=""; let quoted=false;
  for (let i=0;i<line.length;i++) {
    const ch=line[i];
    if (ch === '"') {
      if (quoted && line[i+1] === '"') { cur += '"'; i++; } else quoted=!quoted;
    } else if (ch === "," && !quoted) { out.push(cur); cur=""; }
    else cur += ch;
  }
  out.push(cur); return out;
}
function csvRows(path) {
  const lines=read(path).trim().split(/\r?\n/);
  const header=parseCsvLine(lines[0]);
  return lines.slice(1).filter(Boolean).map(line=>{
    const vals=parseCsvLine(line);
    return Object.fromEntries(header.map((h,i)=>[h,vals[i]??""]));
  });
}

const sourceRows=csvRows("data/meta/sources.csv");
const sourceIds=new Set();
for (const r of sourceRows) {
  if (!r.source_id) fail("empty source_id");
  if (sourceIds.has(r.source_id)) fail(`duplicate source_id: ${r.source_id}`);
  sourceIds.add(r.source_id);
}
ok(`source registry unique IDs (${sourceIds.size})`);

// Hanja
const byRows=csvRows("data/hanja/normalized/by-reading.csv");
const relationKeys=new Set();
for (const r of byRows) {
  const key=`${r.reading}|${r.codepoint}`;
  if (relationKeys.has(key)) fail(`duplicate reading relation: ${key}`);
  relationKeys.add(key);
}
ok(`no duplicate reading relations (${byRows.length})`);
const chRows=csvRows("data/hanja/normalized/characters.csv");
const chCodes=new Set();
for (const r of chRows) {
  if (chCodes.has(r.codepoint)) fail(`duplicate character codepoint: ${r.codepoint}`);
  chCodes.add(r.codepoint);
  const readings=r.readings?r.readings.split("|"):[];
  if (readings.length !== Number(r.reading_count)) fail(`reading_count mismatch: ${r.codepoint}`);
}
const idx=JSON.parse(read("data/hanja/normalized/reading-index.json"));
const indexRelations=Object.values(idx.readings).reduce((n,a)=>n+a.length,0);
if (indexRelations !== byRows.length) fail("reading-index relation count mismatch");
else ok(`hanja indexes consistent (${indexRelations} relations, ${chRows.length} characters)`);

const stats=JSON.parse(read("data/meta/dataset-stats.json"));
if (stats.hanja.normalized_reading_relations !== byRows.length) fail("dataset-stats hanja relations mismatch");
if (stats.hanja.unique_codepoints !== chRows.length) fail("dataset-stats hanja codepoints mismatch");

// Myeongri
const rowCount=p=>read(p).trim().split(/\r?\n/).length-1;
if (rowCount("data/myeongri/천간.csv") !== 10) fail("천간 count");
if (rowCount("data/myeongri/지지.csv") !== 12) fail("지지 count");
if (rowCount("data/myeongri/육십갑자.csv") !== 60) fail("육십갑자 count");
if (rowCount("data/myeongri/십성_천간100.csv") !== 100) fail("십성 count");
ok("myeongri fixed table counts");

// Surname master
const surnameRows=csvRows("data/surnames/surnames.csv");
const surnameIds=new Set(), surnameCodes=new Set(), surnameRanks=new Set();
for (const r of surnameRows) {
  if (surnameIds.has(r.surname_id)) fail(`duplicate surname_id: ${r.surname_id}`);
  if (surnameCodes.has(r.codepoint)) fail(`duplicate surname codepoint: ${r.codepoint}`);
  if (surnameRanks.has(r.rank_2015)) fail(`duplicate surname rank: ${r.rank_2015}`);
  surnameIds.add(r.surname_id); surnameCodes.add(r.codepoint); surnameRanks.add(r.rank_2015);
  for (const sid of (r.source_ids||"").split("|").filter(Boolean)) if (!sourceIds.has(sid)) fail(`unknown surname source: ${sid}`);
  if (!exists(`data/surnames/entries/${r.hanja}.json`)) fail(`missing detailed surname entry: ${r.hanja}`);
  else {
    const e=JSON.parse(read(`data/surnames/entries/${r.hanja}.json`));
    if (e.surname_id !== r.surname_id || e.identity?.hanja !== r.hanja || e.identity?.hangul !== r.hangul) fail(`entry identity mismatch: ${r.hanja}`);
    if (Number(e.census_2015?.population) !== Number(r.population_2015)) fail(`entry population mismatch: ${r.hanja}`);
    if (Number(e.census_2015?.rank) !== Number(r.rank_2015)) fail(`entry rank mismatch: ${r.hanja}`);
    if (e.stroke_policy?.numerology_default_count !== null) fail(`numerology default must be null: ${r.hanja}`);
  }
}
if (surnameRows.length !== 31) fail(`surname master expected 31, got ${surnameRows.length}`);
else ok("surname master 31 records and detailed entries");

// Top30 expansion selection
const top30=csvRows("data/surnames/top30-excluding-xu-2015.csv");
const expectedRanks=[1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
if (top30.length !== 30) fail(`top30 expansion expected 30, got ${top30.length}`);
if (top30.some(r=>r.hanja==="徐")) fail("top30 expansion must exclude 徐");
if (top30.map(r=>Number(r.original_rank_2015)).join(",") !== expectedRanks.join(",")) fail("top30 rank selection mismatch");
for (let i=1;i<top30.length;i++) if (Number(top30[i-1].population_2015) < Number(top30[i].population_2015)) fail("top30 population order mismatch");
ok("top30 expansion selection");

// Pronunciation
const pronRows=csvRows("data/surnames/pronunciation-profiles.csv");
const pronIds=new Set(pronRows.map(r=>r.surname_id));
if (pronRows.length !== 31 || pronIds.size !== 31) fail("pronunciation profiles must cover 31 surnames");
for (const r of surnameRows) if (!pronIds.has(r.surname_id)) fail(`missing pronunciation profile: ${r.hanja}`);
ok("pronunciation profiles cover 31 surnames");

// Stroke policies
const strokeRows=csvRows("data/surnames/stroke-policies.csv");
const strokeIds=new Set(strokeRows.map(r=>r.surname_id));
if (strokeRows.length !== 31 || strokeIds.size !== 31) fail("stroke policies must cover 31 surnames");
for (const r of strokeRows) {
  if (r.numerology_default_count !== "") fail(`numerology default should be blank: ${r.hanja}`);
  if (r.technical_source_id && !sourceIds.has(r.technical_source_id)) fail(`unknown stroke source: ${r.technical_source_id}`);
}
ok("stroke policies separate technical and numerology counts");

// Disambiguation
const disRows=csvRows("data/surnames/hangul-hanja-disambiguation.csv");
for (const r of disRows) {
  for (const sid of r.surname_ids.split("|").filter(Boolean)) if (!surnameIds.has(sid)) fail(`unknown disambiguation surname_id: ${sid}`);
}
ok("surname disambiguation references");

// Representative clans are partial
const repRows=csvRows("data/surnames/representative-clans-2015.csv");
for (const r of repRows) {
  if (!surnameIds.has(r.surname_id)) fail(`unknown representative clan surname: ${r.surname_id}`);
  if (!sourceIds.has(r.source_id)) fail(`unknown representative clan source: ${r.source_id}`);
  const s=surnameRows.find(x=>x.surname_id===r.surname_id);
  if (Number(r.population_2015) > Number(s.population_2015)) fail(`clan population exceeds surname total: ${r.hanja}/${r.bongwan}`);
}
ok(`representative clan rows (${repRows.length})`);

// Xu complete clan and historical reference checks
const xu=surnameRows.find(r=>r.hanja==="徐");
const clanRows=csvRows("data/surnames/clans-2015.csv");
const xuTotal=clanRows.filter(r=>r.surname_id===xu.surname_id).reduce((n,r)=>n+Number(r.population_2015),0);
if (xuTotal !== Number(xu.population_2015)) fail("徐 clan total mismatch");
const histRows=csvRows("data/surnames/clan-history.csv");
for (const r of histRows) {
  for (const sid of (r.source_ids||"").split("|").filter(Boolean)) if (!sourceIds.has(sid)) fail(`unknown clan-history source: ${sid}`);
  if (!r.evidence_level || !r.caveat) fail(`clan-history evidence metadata missing: ${r.bongwan}`);
}
ok("徐 full clan total and history evidence");

// Stats
if (stats.surnames.master_records !== surnameRows.length) fail("stats surname master count mismatch");
if (stats.surnames.detailed_entries !== surnameRows.length) fail("stats detailed entries mismatch");
if (stats.surnames.top30_expansion_records !== top30.length) fail("stats top30 mismatch");
if (stats.surnames.pronunciation_profiles !== pronRows.length) fail("stats pronunciation mismatch");
if (stats.surnames.stroke_policy_rows !== strokeRows.length) fail("stats stroke policies mismatch");
if (stats.surnames.representative_clan_rows !== repRows.length) fail("stats representative clans mismatch");

if (!process.exitCode) console.log("All integrity checks passed.");
