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
const entryById=new Map();
for (const r of surnameRows) {
  if (surnameIds.has(r.surname_id)) fail(`duplicate surname_id: ${r.surname_id}`);
  if (surnameCodes.has(r.codepoint)) fail(`duplicate surname codepoint: ${r.codepoint}`);
  if (surnameRanks.has(r.rank_2015)) fail(`duplicate surname rank: ${r.rank_2015}`);
  surnameIds.add(r.surname_id); surnameCodes.add(r.codepoint); surnameRanks.add(r.rank_2015);
  for (const sid of (r.source_ids||"").split("|").filter(Boolean)) if (!sourceIds.has(sid)) fail(`unknown surname source: ${sid}`);
  const path=`data/surnames/entries/${r.hanja}.json`;
  if (!exists(path)) fail(`missing detailed surname entry: ${r.hanja}`);
  else {
    const e=JSON.parse(read(path)); entryById.set(r.surname_id,e);
    if (e.surname_id !== r.surname_id || e.identity?.hanja !== r.hanja || e.identity?.hangul !== r.hangul) fail(`entry identity mismatch: ${r.hanja}`);
    if (Number(e.census_2015?.population) !== Number(r.population_2015)) fail(`entry population mismatch: ${r.hanja}`);
    if (Number(e.census_2015?.rank) !== Number(r.rank_2015)) fail(`entry rank mismatch: ${r.hanja}`);
    if (e.stroke_policy?.numerology_default_count !== null) fail(`numerology default must be null: ${r.hanja}`);
  }
}
if (surnameRows.length !== 31) fail(`surname master expected 31, got ${surnameRows.length}`);
else ok("surname master 31 records and detailed entries");

// Top30
const top30=csvRows("data/surnames/top30-excluding-xu-2015.csv");
const expectedRanks=[1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
if (top30.length !== 30) fail(`top30 expansion expected 30, got ${top30.length}`);
if (top30.some(r=>r.hanja==="徐")) fail("top30 expansion must exclude 徐");
if (top30.map(r=>Number(r.original_rank_2015)).join(",") !== expectedRanks.join(",")) fail("top30 rank selection mismatch");
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
for (const r of disRows) for (const sid of r.surname_ids.split("|").filter(Boolean)) if (!surnameIds.has(sid)) fail(`unknown disambiguation surname_id: ${sid}`);
ok("surname disambiguation references");

// Exact 2015 clan summaries
const clanCoreRows=csvRows("data/surnames/clans-core-2015.csv");
const clanCoreBySurname=new Map();
for (const r of clanCoreRows) {
  if (!surnameIds.has(r.surname_id)) fail(`unknown clan-core surname: ${r.surname_id}`);
  if (!clanCoreBySurname.has(r.surname_id)) clanCoreBySurname.set(r.surname_id,[]);
  clanCoreBySurname.get(r.surname_id).push(r);
  for (const sid of (r.source_ids||"").split("|").filter(Boolean)) if (!sourceIds.has(sid)) fail(`unknown clan-core source: ${sid}`);
}
for (const s of surnameRows) {
  if (Number(s.male_2015)+Number(s.female_2015)!==Number(s.population_2015)) fail(`surname sex total mismatch: ${s.hanja}`);
  const rows=clanCoreBySurname.get(s.surname_id)||[];
  if (!rows.length) fail(`missing clan summary: ${s.hanja}`);
  const aggregates=rows.filter(r=>r.is_aggregate==="true");
  if (aggregates.length!==1) fail(`clan summary aggregate count: ${s.hanja}`);
  const named=rows.filter(r=>r.is_aggregate!=="true");
  if (named.length<1 || named.length>7) fail(`clan summary named row count: ${s.hanja}`);
  for(let i=1;i<named.length;i++) if(Number(named[i-1].population_2015)<Number(named[i].population_2015)) fail(`clan summary not population-descending: ${s.hanja}`);
  const pop=rows.reduce((n,r)=>n+Number(r.population_2015),0);
  const male=rows.reduce((n,r)=>n+Number(r.male_2015),0);
  const female=rows.reduce((n,r)=>n+Number(r.female_2015),0);
  if(pop!==Number(s.population_2015) || male!==Number(s.male_2015) || female!==Number(s.female_2015)) fail(`clan summary total mismatch: ${s.hanja}`);
  const e=entryById.get(s.surname_id);
  const erows=e?.clans_2015_summary?.rows||[];
  if(erows.length!==rows.length) fail(`embedded clan summary row count mismatch: ${s.hanja}`);
  if(e?.verification?.clan_summary_status!=="validated_exact_total_2015") fail(`embedded clan summary status missing: ${s.hanja}`);
  if(Number(e?.census_2015?.male)!==Number(s.male_2015) || Number(e?.census_2015?.female)!==Number(s.female_2015)) fail(`embedded sex total mismatch: ${s.hanja}`);
}
if (clanCoreBySurname.size!==31) fail(`clan summary expected 31 surnames, got ${clanCoreBySurname.size}`);
ok(`exact clan summaries: ${clanCoreRows.length} rows / 31 surnames`);

// Representative clans
const repRows=csvRows("data/surnames/representative-clans-2015.csv");
for (const r of repRows) {
  if (!surnameIds.has(r.surname_id)) fail(`unknown representative clan surname: ${r.surname_id}`);
  if (!sourceIds.has(r.source_id)) fail(`unknown representative clan source: ${r.source_id}`);
  const s=surnameRows.find(x=>x.surname_id===r.surname_id);
  if (Number(r.population_2015) > Number(s.population_2015)) fail(`clan population exceeds surname total: ${r.hanja}/${r.bongwan}`);
}
ok(`representative clan rows (${repRows.length})`);

// Genealogy evidence
const histRows=csvRows("data/surnames/clan-history.csv");
const historyIds=new Set();
let conflictOrVariant=0, mythOrLegend=0;
for (const r of histRows) {
  if (!surnameIds.has(r.surname_id)) fail(`unknown clan-history surname_id: ${r.surname_id}`);
  historyIds.add(r.surname_id);
  const ids=(r.source_ids||"").split("|").filter(Boolean);
  if (!ids.length) fail(`clan-history missing source: ${r.surname_id}/${r.bongwan}`);
  for (const sid of ids) if (!sourceIds.has(sid)) fail(`unknown clan-history source: ${sid}`);
  if (!r.claim_type || !r.evidence_level || !r.claim || !r.caveat) fail(`clan-history metadata missing: ${r.surname_id}/${r.bongwan}`);
  if (/conflict|variant/.test(r.claim_type)) { conflictOrVariant++; if (!r.caveat) fail(`conflict without caveat: ${r.surname_id}`); }
  if (/myth|legend/.test(r.claim_type)) mythOrLegend++;
}
if (histRows.length !== 33) fail(`clan-history expected 33 rows, got ${histRows.length}`);
if (historyIds.size !== 31) fail(`clan-history expected 31 surnames, got ${historyIds.size}`);
for (const r of surnameRows) if (!historyIds.has(r.surname_id)) fail(`surname has no genealogy row: ${r.hanja}`);
ok(`genealogy evidence: ${histRows.length} rows / ${historyIds.size} surnames`);

// Embedded genealogy in 30 expanded entries
for (const r of surnameRows) {
  const e=entryById.get(r.surname_id);
  if (r.hanja==="徐") {
    if (!e.clan_history && !Array.isArray(e.genealogy_research)) fail("徐 must retain deep clan history");
    continue;
  }
  if (!Array.isArray(e.genealogy_research) || e.genealogy_research.length < 1) fail(`missing embedded genealogy_research: ${r.hanja}`);
  for (const g of e.genealogy_research || []) {
    if (!g.claim_type || !g.evidence_level || !g.claim || !g.caveat) fail(`embedded genealogy metadata missing: ${r.hanja}`);
    for (const sid of g.source_ids || []) if (!sourceIds.has(sid)) fail(`unknown embedded genealogy source: ${r.hanja}/${sid}`);
    if (g.do_not_infer_beyond_source !== true) fail(`genealogy inference guard missing: ${r.hanja}`);
  }
  if (!e.research_status?.overall_status) fail(`missing research_status: ${r.hanja}`);
  if (e.verification?.hangnyeol_status !== "pending_verified_source") fail(`hangnyeol must remain pending: ${r.hanja}`);
}
ok("30 expanded surname entries embed genealogy evidence");

// Xu full clan total
const xu=surnameRows.find(r=>r.hanja==="徐");
const clanRows=csvRows("data/surnames/clans-2015.csv");
const xuTotal=clanRows.filter(r=>r.surname_id===xu.surname_id).reduce((n,r)=>n+Number(r.population_2015),0);
if (xuTotal !== Number(xu.population_2015)) fail("徐 clan total mismatch");
else ok("徐 full 2015 clan total");

// Research status matrix
const researchRows=csvRows("data/surnames/research-status.csv");
const researchIds=new Set();
for (const r of researchRows) {
  if (!surnameIds.has(r.surname_id)) fail(`unknown research-status surname: ${r.surname_id}`);
  if (researchIds.has(r.surname_id)) fail(`duplicate research-status surname: ${r.surname_id}`);
  researchIds.add(r.surname_id);
  if (!r.overall_status || !r.hangnyeol_generation_data) fail(`research-status incomplete: ${r.hanja}`);
}
if (researchRows.length !== 31 || researchIds.size !== 31) fail("research-status must cover 31 surnames");
ok("research-status covers 31 surnames");

// Stats
if (stats.surnames.master_records !== surnameRows.length) fail("stats surname master count mismatch");
if (stats.surnames.detailed_entries !== surnameRows.length) fail("stats detailed entries mismatch");
if (stats.surnames.top30_expansion_records !== top30.length) fail("stats top30 mismatch");
if (stats.surnames.pronunciation_profiles !== pronRows.length) fail("stats pronunciation mismatch");
if (stats.surnames.stroke_policy_rows !== strokeRows.length) fail("stats stroke policies mismatch");
if (stats.surnames.representative_clan_rows !== repRows.length) fail("stats representative clans mismatch");
if (stats.surnames.clan_summary_rows !== clanCoreRows.length) fail("stats clan-summary rows mismatch");
if (stats.surnames.clan_summary_named_rows !== clanCoreRows.filter(r=>r.is_aggregate!=="true").length) fail("stats clan-summary named rows mismatch");
if (stats.surnames.clan_summary_aggregate_rows !== clanCoreRows.filter(r=>r.is_aggregate==="true").length) fail("stats clan-summary aggregate rows mismatch");
if (stats.surnames.clan_summary_exact_total_surnames !== clanCoreBySurname.size) fail("stats clan-summary surname coverage mismatch");
if (stats.surnames.sex_totals_complete_surnames !== surnameRows.filter(r=>r.male_2015&&r.female_2015).length) fail("stats sex-total coverage mismatch");
if (stats.surnames.clan_history_rows !== histRows.length) fail("stats clan-history mismatch");
if (stats.surnames.surnames_with_clan_history !== historyIds.size) fail("stats genealogy surname coverage mismatch");
if (stats.surnames.research_status_rows !== researchRows.length) fail("stats research-status mismatch");
if (stats.surnames.explicit_conflict_or_variant_rows !== conflictOrVariant) fail(`stats conflict rows mismatch: expected ${conflictOrVariant}`);
if (stats.surnames.myth_or_legend_rows !== mythOrLegend) fail(`stats myth/legend rows mismatch: expected ${mythOrLegend}`);

if (!process.exitCode) console.log("All integrity checks passed.");
