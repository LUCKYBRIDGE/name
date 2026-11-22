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

const requiredNoticeFiles=[
  "THIRD_PARTY_NOTICES.md",
  "LICENSES/MIT-rutopio.txt",
  "LICENSES/BSD-3-Clause-libhangul-hanja.txt",
  "LICENSES/Unicode-3.0.txt",
  "data/meta/license-map.csv",
  "COPYRIGHT.md",
  "RIGHTS_AUDIT.md",
  "COPYRIGHT_AND_DATA_USE.md",
  "CONTRIBUTING.md",
  "APP_ATTRIBUTION.md",
  "data/meta/distribution-policy.csv",
  "data/meta/source-rights.csv"
];
for (const p of requiredNoticeFiles) if (!exists(p)) fail(`missing third-party notice file: ${p}`);

const sourceRows=csvRows("data/meta/sources.csv");
const sourceIds=new Set();
for (const r of sourceRows) {
  if (!r.source_id) fail("empty source_id");
  if (sourceIds.has(r.source_id)) fail(`duplicate source_id: ${r.source_id}`);
  sourceIds.add(r.source_id);
}
ok(`source registry unique IDs (${sourceIds.size})`);

const sourceRightsRows=csvRows("data/meta/source-rights.csv");
if (sourceRightsRows.length!==sourceRows.length) fail("source-rights row count mismatch");
const sourceRightsIds=new Set();
const allowedRightsClasses=new Set([
  "embedded_open_license",
  "reference_only_open_source",
  "official_statistics_reuse_policy",
  "public_text_KOGL_type1",
  "public_calendar_KOGL_type1_scoped",
  "statutory_official_text",
  "official_reference_bulk_reuse_unverified",
  "academic_reference_only",
  "secondary_reference_only",
  "reference_terms_not_item_verified"
]);
for (const rr of sourceRightsRows) {
  if (!sourceIds.has(rr.source_id)) fail(`source-rights unknown source: ${rr.source_id}`);
  if (sourceRightsIds.has(rr.source_id)) fail(`duplicate source-rights row: ${rr.source_id}`);
  sourceRightsIds.add(rr.source_id);
  if (!allowedRightsClasses.has(rr.rights_class)) fail(`unknown rights_class: ${rr.source_id}/${rr.rights_class}`);
  if (!rr.repository_use || !rr.app_use || !rr.redistribution_basis || !rr.broad_release_action) fail(`source-rights metadata missing: ${rr.source_id}`);
  if (!["true","false"].includes(rr.attribution_required)) fail(`invalid attribution_required: ${rr.source_id}`);
  if (!["true","false"].includes(rr.embedded_source_content)) fail(`invalid embedded_source_content: ${rr.source_id}`);
  const src=sourceRows.find(s=>s.source_id===rr.source_id);
  if (src?.license==="unknown" && !["official_reference_bulk_reuse_unverified","academic_reference_only","secondary_reference_only","reference_terms_not_item_verified"].includes(rr.rights_class)) {
    fail(`unknown-license source classified too permissively: ${rr.source_id}/${rr.rights_class}`);
  }
  if (rr.embedded_source_content==="true" && !["embedded_open_license"].includes(rr.rights_class)) {
    fail(`embedded source content lacks explicit redistributable class: ${rr.source_id}`);
  }
  if (rr.rights_class==="public_text_KOGL_type1" && !rr.attribution_template.includes("ⓒ한국민족문화대백과사전")) {
    fail(`AKS attribution template missing: ${rr.source_id}`);
  }
}
for (const id of sourceIds) if (!sourceRightsIds.has(id)) fail(`source missing rights row: ${id}`);
for (const id of ["KR_COURT_HANJA","KR_COURT_HANJA_PDF"]) {
  if (sourceRightsRows.find(r=>r.source_id===id)?.rights_class!=="official_reference_bulk_reuse_unverified") fail(`court source must remain reference-only until bulk reuse terms verified: ${id}`);
}
if (sourceRightsRows.find(r=>r.source_id==="YESJOKBO_CENSUS2015_APPENDIX")?.rights_class!=="secondary_reference_only") fail("YESJOKBO must remain secondary-reference-only");
ok(`source rights registry: ${sourceRightsRows.length} classified sources`);
const licenseMapRows=csvRows("data/meta/license-map.csv");
for (const r of licenseMapRows) {
  for (const sid of (r.source_ids||"").split("|").filter(Boolean)) {
    if (sid==="multiple_source_ids") continue;
    if (!sourceIds.has(sid)) fail(`unknown license-map source: ${sid}`);
  }
  if (r.notice_required==="true") {
    const noticeFiles=(r.notice_file||"").split("|").filter(Boolean);
    if (!noticeFiles.length) fail(`notice required without notice_file: ${r.path_pattern}`);
    for (const p of noticeFiles) if (!exists(p)) fail(`license-map notice file missing: ${p}`);
  }
}
const thirdPartyNotices=read("THIRD_PARTY_NOTICES.md");
if (!thirdPartyNotices.includes("RUTOPIO_NAME_HANJA")) fail("third-party notices missing rutopio attribution");
if (!thirdPartyNotices.includes("LIBHANGUL_HANJA")) fail("third-party notices missing libhangul attribution");
if (!thirdPartyNotices.includes("UNICODE_UNIHAN")) fail("third-party notices missing Unicode attribution");
ok(`third-party license notices: ${licenseMapRows.length} path mappings`);

const distributionRows=csvRows("data/meta/distribution-policy.csv");
const allowedDistributionStatuses=new Set([
  "allowed_with_third_party_notices",
  "allowed_with_source_attribution",
  "review_before_broad_public_release",
  "row_level_source_check_required",
  "allowed_with_kasi_attribution_if_scope_verified",
  "original_compilation_reference_only_sources",
  "first_party_all_rights_reserved",
  "reference_metadata_only"
]);
for (const r of distributionRows) {
  if (!r.path_pattern) fail("distribution policy missing path_pattern");
  if (!allowedDistributionStatuses.has(r.distribution_status)) fail(`unknown distribution status: ${r.path_pattern}/${r.distribution_status}`);
  if (!r.required_action || !r.risk_level || !r.notes) fail(`distribution policy metadata missing: ${r.path_pattern}`);
  if (!["low","medium","high"].includes(r.risk_level)) fail(`invalid distribution risk: ${r.path_pattern}/${r.risk_level}`);
}
if (!distributionRows.some(r=>r.path_pattern==="data/surnames/clans-core-2015.csv" && r.distribution_status==="review_before_broad_public_release")) {
  fail("clans-core must remain review-before-broad-release");
}
const copyrightNotice=read("COPYRIGHT.md");
const copyrightPolicy=read("COPYRIGHT_AND_DATA_USE.md");
const appAttribution=read("APP_ATTRIBUTION.md");
if (!copyrightNotice.includes("All rights reserved") || !copyrightNotice.includes("Third-party")) fail("COPYRIGHT.md must preserve first-party/third-party separation");
if (!copyrightPolicy.includes("public") || !copyrightPolicy.includes("YESJOKBO_CENSUS2015_APPENDIX")) fail("copyright policy missing public-repository/secondary-source safeguards");
if (!appAttribution.includes("ⓒ한국민족문화대백과사전")) fail("app attribution missing AKS required attribution form");
if (!appAttribution.includes("KOSIS") || !appAttribution.includes("한국천문연구원")) fail("app attribution missing KOSIS/KASI source notice");
ok(`distribution policy: ${distributionRows.length} path rules`);


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
if (stats.schema_version !== JSON.parse(read("data/meta/schema-version.json")).schema_version) fail("dataset/schema version mismatch");

const buildManifest=JSON.parse(read("data/meta/build-manifest.json"));
let reproducibleFiles=0;
for (const step of buildManifest.derived||[]) {
  if (step.reproducibility!=="exact") fail(`non-exact derived step: ${step.generator}`);
  if (!exists(step.generator)) fail(`missing generator: ${step.generator}`);
  for (const p of step.inputs||[]) if (!exists(p)) fail(`missing generator input: ${p}`);
  for (const p of step.outputs||[]) { if (!exists(p)) fail(`missing generated output: ${p}`); reproducibleFiles++; }
}
const sourceAuditRows=csvRows("data/meta/source-audit.csv");
if (sourceAuditRows.length!==sourceRows.length) fail("source audit row count mismatch");
const auditIds=new Set(sourceAuditRows.map(r=>r.source_id));
for (const id of sourceIds) if (!auditIds.has(id)) fail(`source missing audit row: ${id}`);
ok(`build manifest/source audit: ${buildManifest.derived.length} steps / ${sourceAuditRows.length} sources`);

// Hanja multi-sense semantics
const senseRows=csvRows("data/hanja/semantics/meaning-senses.csv");
const senseById=new Map();
const sensesByRelation=new Map();
const semanticChars=new Set();
for (const r of senseRows) {
  if (!r.sense_id || senseById.has(r.sense_id)) fail(`duplicate/empty sense_id: ${r.sense_id}`);
  senseById.set(r.sense_id,r);
  semanticChars.add(r.codepoint);
  if (!sensesByRelation.has(r.meaning_relation_id)) sensesByRelation.set(r.meaning_relation_id,[]);
  sensesByRelation.get(r.meaning_relation_id).push(r);
  if (!sourceIds.has(r.meaning_source_id)) fail(`unknown meaning source: ${r.meaning_source_id}`);
  if (!sourceIds.has(r.legal_relation_source_id)) fail(`unknown legal relation source: ${r.legal_relation_source_id}`);
  if (r.derivation_status !== "mechanically_split_from_meaning_ko") fail(`unexpected semantic derivation: ${r.sense_id}`);
}
let semanticMultiRelations=0;
for (const [relationId, rows] of sensesByRelation) {
  rows.sort((a,b)=>Number(a.sense_order)-Number(b.sense_order));
  const expectedCount=rows.length;
  if (expectedCount>1) semanticMultiRelations++;
  for (let i=0;i<rows.length;i++) {
    if (Number(rows[i].sense_order)!==i+1) fail(`sense order gap: ${relationId}`);
    if (Number(rows[i].relation_sense_count)!==expectedCount) fail(`relation_sense_count mismatch: ${relationId}`);
    if ((rows[i].multi_sense_relation==="true") !== (expectedCount>1)) fail(`multi_sense flag mismatch: ${rows[i].sense_id}`);
  }
}
if (senseRows.length!==13046) fail(`semantic sense rows expected 13046, got ${senseRows.length}`);
if (sensesByRelation.size!==7425) fail(`semantic relations expected 7425, got ${sensesByRelation.size}`);
if (semanticChars.size!==7150) fail(`semantic characters expected 7150, got ${semanticChars.size}`);
if (semanticMultiRelations!==3492) fail(`multi-sense relations expected 3492, got ${semanticMultiRelations}`);
ok(`hanja semantic senses: ${senseRows.length} senses / ${sensesByRelation.size} relations`);

// Reading-specific example: 樂 meanings must remain separated by reading.
const luckByReading = {};
for (const r of senseRows.filter(r=>r.hanja==="樂")) {
  if (!luckByReading[r.legal_reading]) luckByReading[r.legal_reading]=[];
  luckByReading[r.legal_reading].push(r.raw_sense);
}
if (!luckByReading["낙"]?.includes("즐길 낙")) fail("樂/낙 semantic mapping missing");
if (!luckByReading["락"]?.includes("즐거울 락")) fail("樂/락 semantic mapping missing");
if (!luckByReading["악"]?.includes("풍류 악")) fail("樂/악 semantic mapping missing");
if (!luckByReading["요"]?.includes("좋아할 요")) fail("樂/요 semantic mapping missing");
ok("reading-specific Hanja meanings remain separated");

// Curated naming meaning layer
const curatedRows=csvRows("data/hanja/semantics/naming-meaning-curated.csv");
const curatedChars=new Set();
const allowedUseClasses=new Set(["preferred_name_sense","usable_name_sense","contextual_dictionary_sense","caution_other_dictionary_sense"]);
for (const r of curatedRows) {
  curatedChars.add(r.hanja);
  if (!allowedUseClasses.has(r.naming_use_class)) fail(`unknown naming_use_class: ${r.naming_use_class}`);
  if (r.interpretation_status!=="editorial_paraphrase_from_documented_sense") fail(`curated interpretation status mismatch: ${r.hanja}/${r.legal_reading}/${r.sense_order}`);
  if (!sourceIds.has(r.dictionary_source_id)) fail(`unknown curated dictionary source: ${r.dictionary_source_id}`);
  const matches=senseRows.filter(s=>s.hanja===r.hanja && s.legal_reading===r.legal_reading && Number(s.sense_order)===Number(r.sense_order));
  if (matches.length!==1) fail(`curated sense lookup mismatch: ${r.hanja}/${r.legal_reading}/${r.sense_order}`);
  else if (matches[0].raw_sense!==r.raw_sense) fail(`curated raw_sense mismatch: ${r.hanja}/${r.legal_reading}/${r.sense_order}`);
  if (r.naming_use_class==="caution_other_dictionary_sense" && r.primary_name_explanation_allowed!=="false") fail(`caution sense cannot be primary: ${r.hanja}/${r.raw_sense}`);
}
if (curatedRows.length!==202) fail(`curated naming rows expected 202, got ${curatedRows.length}`);
if (curatedChars.size!==95) fail(`curated naming characters expected 95, got ${curatedChars.size}`);
const yu祐=senseRows.filter(r=>r.hanja==="祐"&&r.legal_reading==="우").map(r=>r.raw_sense);
if (yu祐.length!==2 || !yu祐.includes("도울 우") || !yu祐.includes("다행할 우")) fail("祐/우 must preserve two documented senses");
const yu優=senseRows.filter(r=>r.hanja==="優"&&r.legal_reading==="우").map(r=>r.raw_sense);
if (yu優.length!==4 || !yu優.includes("결단성 없을 우")) fail("優/우 must preserve all four senses including caution sense");
ok(`curated naming meanings: ${curatedRows.length} rows / ${curatedChars.size} characters`);

if (stats.hanja.semantic_sense_rows!==senseRows.length) fail("stats semantic_sense_rows mismatch");
if (stats.hanja.semantic_relations!==sensesByRelation.size) fail("stats semantic_relations mismatch");
if (stats.hanja.multi_sense_relations!==semanticMultiRelations) fail("stats multi_sense_relations mismatch");
if (stats.hanja.semantic_unique_characters!==semanticChars.size) fail("stats semantic_unique_characters mismatch");
if (stats.hanja.curated_naming_sense_rows!==curatedRows.length) fail("stats curated_naming_sense_rows mismatch");
if (stats.hanja.curated_naming_characters!==curatedChars.size) fail("stats curated_naming_characters mismatch");

// Semantic source-quality holds: suspicious source strings are never silently repaired or promoted.
const semanticIssueRows=csvRows("data/hanja/semantics/semantic-source-issues.csv");
const semanticIssueIds=new Set();
const allowedIssueStatuses=new Set(["hold_for_source_recheck","needs_review","resolved"]);
for (const r of semanticIssueRows) {
  if (!r.issue_id || semanticIssueIds.has(r.issue_id)) fail(`duplicate/empty semantic source issue: ${r.issue_id}`);
  semanticIssueIds.add(r.issue_id);
  if (!allowedIssueStatuses.has(r.status)) fail(`unknown semantic source issue status: ${r.issue_id}/${r.status}`);
  if (!sourceIds.has(r.source_id)) fail(`unknown semantic issue source: ${r.issue_id}/${r.source_id}`);
  const matches=senseRows.filter(s=>s.hanja===r.hanja && s.legal_reading===r.legal_reading && Number(s.sense_order)===Number(r.sense_order));
  if (matches.length!==1) fail(`semantic source issue lookup mismatch: ${r.issue_id}`);
  else if (matches[0].raw_sense!==r.raw_sense) fail(`semantic source issue raw_sense mismatch: ${r.issue_id}`);
  if (r.status==="hold_for_source_recheck") {
    const promoted=curatedRows.find(x=>x.hanja===r.hanja && x.legal_reading===r.legal_reading && Number(x.sense_order)===Number(r.sense_order) && x.primary_name_explanation_allowed==="true");
    if (promoted) fail(`held semantic source issue promoted to naming meaning: ${r.issue_id}`);
  }
}
if (semanticIssueRows.length!==4) fail(`semantic source issues expected 4, got ${semanticIssueRows.length}`);
if (stats.hanja.semantic_source_issue_rows!==semanticIssueRows.length) fail("stats semantic source issue count mismatch");
ok(`semantic source-quality holds: ${semanticIssueRows.length} rows`);

// Selected naming sense / intent / semantic-risk policy
const selectionPolicy=JSON.parse(read("data/hanja/semantics/name-meaning-selection.policy.json"));
if (selectionPolicy.version!=="1.0.0") fail("semantic selection policy version mismatch");
const selectionSchema=JSON.parse(read("data/hanja/semantics/name-meaning-selection.schema.json"));
if (selectionSchema.$schema!=="https://json-schema.org/draft/2020-12/schema") fail("selection schema must use JSON Schema draft 2020-12");
if (selectionSchema.type!=="object" || selectionSchema.additionalProperties!==false) fail("selection schema root shape");
const requiredSelectionFields=new Set(selectionSchema.required||[]);
for (const f of ["hanja","reading","all_sense_ids","selected_sense_ids","selection_origin","naming_intent","semantic_risk","interpretation"]) {
  if (!requiredSelectionFields.has(f)) fail(`selection schema missing required field: ${f}`);
}
if (!selectionSchema.properties?.selected_sense_ids?.uniqueItems) fail("selected_sense_ids must be unique");
if (selectionSchema.properties?.interpretation?.properties?.status?.const!=="editorial_paraphrase_not_dictionary_definition") fail("selection schema interpretation status constant");

const riskRows=csvRows("data/hanja/semantics/semantic-risk-rules.csv");
const riskIds=new Set(), validRiskLevels=new Set(["none","low","medium","high","invalid"]);
for (const r of riskRows) {
  if (!r.rule_id || riskIds.has(r.rule_id)) fail(`duplicate/empty semantic risk rule: ${r.rule_id}`);
  riskIds.add(r.rule_id);
  if (!validRiskLevels.has(r.risk_level)) fail(`invalid semantic risk level: ${r.rule_id}/${r.risk_level}`);
  if (r.risk_level==="invalid" && r.auto_reject_character!=="true") fail(`invalid semantic rule must block selection: ${r.rule_id}`);
  if (r.risk_level!=="invalid" && r.auto_reject_character==="true") fail(`non-invalid semantic rule must not auto reject: ${r.rule_id}`);
}
if (riskRows.length!==9) fail(`semantic risk rules expected 9, got ${riskRows.length}`);

const concernRows=csvRows("data/hanja/semantics/sense-concern-curated.csv");
for (const r of concernRows) {
  if (!["low","medium","high"].includes(r.concern_level)) fail(`invalid concern level: ${r.hanja}/${r.raw_sense}`);
  const matches=senseRows.filter(s=>s.hanja===r.hanja && s.legal_reading===r.reading && Number(s.sense_order)===Number(r.sense_order));
  if (matches.length!==1) fail(`sense concern lookup mismatch: ${r.hanja}/${r.reading}/${r.sense_order}`);
  else if (matches[0].raw_sense!==r.raw_sense) fail(`sense concern raw_sense mismatch: ${r.hanja}/${r.raw_sense}`);
}
if (concernRows.length!==5) fail(`sense concern rows expected 5, got ${concernRows.length}`);

const selectionExamples=JSON.parse(read("data/hanja/semantics/selection-examples.json"));
if (selectionExamples.version!=="1.0.0") fail("selection examples version mismatch");
for (const ex of selectionExamples.examples||[]) {
  const c=ex.character;
  if (!c?.hanja || !c?.reading) fail("selection example missing Hanja/reading");
  if (!Array.isArray(c.all_sense_ids) || !c.all_sense_ids.length) fail(`selection example all_sense_ids missing: ${c?.hanja}`);
  if (!Array.isArray(c.selected_sense_ids) || !c.selected_sense_ids.length) fail(`selection example selected_sense_ids missing: ${c?.hanja}`);
  const exact=senseRows.filter(s=>s.hanja===c.hanja && s.legal_reading===c.reading);
  const exactIds=new Set(exact.map(s=>s.sense_id));
  if (exactIds.size!==c.all_sense_ids.length || c.all_sense_ids.some(id=>!exactIds.has(id))) fail(`selection example all senses mismatch: ${c.hanja}/${c.reading}`);
  if (c.selected_sense_ids.some(id=>!exactIds.has(id))) fail(`selected sense outside exact Hanja+reading: ${c.hanja}/${c.reading}`);
  if (!validRiskLevels.has(c.semantic_risk?.level)) fail(`selection example risk invalid: ${c.hanja}`);
  for (const id of c.semantic_risk?.reason_ids||[]) if (!riskIds.has(id)) fail(`unknown selection example risk rule: ${c.hanja}/${id}`);
  if (c.semantic_risk?.level!=="invalid" && c.semantic_risk?.auto_reject_character===true) fail(`valid selection example must not auto reject: ${c.hanja}`);
  if (c.interpretation?.status!=="editorial_paraphrase_not_dictionary_definition") fail(`selection interpretation status mismatch: ${c.hanja}`);
}
if ((selectionExamples.examples||[]).length!==3) fail("selection examples expected 3 records");

// Explicit policy regression: 優/우 can select 넉넉할 우, but must surface the negative other sense as a notice rather than rejecting the character.
const yuExample=(selectionExamples.examples||[]).find(ex=>ex.character?.hanja==="優"&&ex.character?.reading==="우");
if (!yuExample?.character?.selected_sense_ids?.includes("U0512A-우-01")) fail("優 example must select 넉넉할 우");
if (yuExample?.character?.semantic_risk?.level!=="medium" || yuExample?.character?.semantic_risk?.auto_reject_character!==false) fail("優 mixed meaning must be medium notice, not auto rejection");
const yuConcern=concernRows.find(r=>r.hanja==="優"&&r.reading==="우"&&r.raw_sense==="결단성 없을 우");
if (!yuConcern || yuConcern.applies_as_other_sense!=="medium") fail("優 caution other-sense policy missing");

// Existing-name intent must be allowed to remain unknown rather than inferred.
const unknownIntentRule=riskRows.find(r=>r.rule_id==="SEM009");
if (!unknownIntentRule || unknownIntentRule.recommendation_action!=="do_not_invent_intent") fail("unknown naming-intent policy missing");

if (stats.hanja.semantic_selection_policy_version!==selectionPolicy.version) fail("stats semantic selection policy version mismatch");
if (stats.hanja.semantic_risk_rule_rows!==riskRows.length) fail("stats semantic risk rule rows mismatch");
if (stats.hanja.curated_sense_concern_rows!==concernRows.length) fail("stats sense concern rows mismatch");
if (stats.hanja.selection_example_records!==(selectionExamples.examples||[]).length) fail("stats selection example count mismatch");
if (stats.hanja.build_reproducible_steps!==buildManifest.derived.length) fail("stats build step count mismatch");
if (stats.hanja.build_reproducible_files!==reproducibleFiles) fail("stats build file count mismatch");
if (stats.sources.registry_records!==sourceRows.length) fail("stats source registry count mismatch");
if (stats.sources.rights_registry_records!==sourceRightsRows.length) fail("stats source rights count mismatch");
if (stats.sources.unknown_license_metadata!==sourceRows.filter(r=>r.license==="unknown").length) fail("stats unknown license metadata count mismatch");
ok(`semantic selection policy: ${riskRows.length} rules / ${concernRows.length} curated concerns / ${selectionExamples.examples.length} examples`);

// Myeongri
const rowCount=p=>read(p).trim().split(/\r?\n/).length-1;
if (rowCount("data/myeongri/천간.csv") !== 10) fail("천간 count");
if (rowCount("data/myeongri/지지.csv") !== 12) fail("지지 count");
if (rowCount("data/myeongri/육십갑자.csv") !== 60) fail("육십갑자 count");
if (rowCount("data/myeongri/십성_천간100.csv") !== 100) fail("십성 count");
ok("myeongri fixed table counts");

// Naming-method registry: different schools/methods stay separate.
const methodRows=csvRows("data/methods/naming-method-registry.csv");
const methodIds=new Set();
for (const r of methodRows) {
  if (!r.method_id || methodIds.has(r.method_id)) fail(`duplicate/empty naming method_id: ${r.method_id}`);
  methodIds.add(r.method_id);
  if (!r.domain || !r.method_name || !r.status || !r.implementation_policy || !r.caveat) fail(`naming method metadata missing: ${r.method_id}`);
  for (const sid of (r.source_ids||"").split("|").filter(Boolean)) if (!sourceIds.has(sid)) fail(`unknown naming method source: ${r.method_id}/${sid}`);
}
if (methodRows.length!==7) fail(`naming method registry expected 7, got ${methodRows.length}`);
const axisPolicy=JSON.parse(read("data/methods/evaluation-axis-policy.json"));
if (axisPolicy.version!=="1.0.0" || !Array.isArray(axisPolicy.axes) || axisPolicy.axes.length!==8) fail("evaluation axis policy shape/count");
if (new Set(axisPolicy.axes.map(a=>a.axis_id)).size!==axisPolicy.axes.length) fail("duplicate evaluation axis_id");
if (stats.methods?.naming_method_registry_rows!==methodRows.length) fail("stats naming method count mismatch");
if (stats.methods?.evaluation_axes!==axisPolicy.axes.length) fail("stats evaluation axis count mismatch");
ok(`naming method registry: ${methodRows.length} methods / ${axisPolicy.axes.length} evidence axes`);

// Current legal naming-rule summary stays separate from the Hanja candidate mirror.
const legalRows=csvRows("data/legal/name-registration-rules.csv");
const legalIds=new Set();
for (const r of legalRows) {
  if (!r.rule_id || legalIds.has(r.rule_id)) fail(`duplicate/empty legal naming rule: ${r.rule_id}`);
  legalIds.add(r.rule_id);
  if (!r.category || !r.rule_summary || !r.effective_status || !r.verified_on || !r.app_policy) fail(`legal naming metadata missing: ${r.rule_id}`);
  if (!sourceIds.has(r.source_id)) fail(`unknown legal naming source: ${r.rule_id}/${r.source_id}`);
}
if (legalRows.length!==6) fail(`legal naming rules expected 7, got ${legalRows.length}`);
if (stats.legal?.name_registration_rule_rows!==legalRows.length) fail("stats legal naming rule count mismatch");
ok(`legal naming rules: ${legalRows.length} current rule/service summaries`);

const solarRows=[...csvRows("data/time/2026_24절기_KASI.csv"),...csvRows("data/time/2027_24절기_KASI.csv")];
if (solarRows.length!==48) fail(`solar term rows expected 48, got ${solarRows.length}`);
for (const r of solarRows) {
  if (r.source_id!=="KASI_CALENDAR") fail(`solar term source_id mismatch: ${r.year}/${r.term}`);
  if (r.status!=="official_calendar_data_verified_2026-11-14") fail(`solar term verification status mismatch: ${r.year}/${r.term}`);
}
if (stats.time.solar_term_rows!==solarRows.length || stats.time.official_calendar_verified_rows!==solarRows.length) fail("stats solar term count mismatch");
ok("KASI 2026/2027 solar terms verified metadata");

// Exact minute-before / at-boundary regression vectors for month-branch switching.
const boundaryRows=csvRows("tests/사주-절기경계-검증.csv");
if (boundaryRows.length!==48) fail(`solar-term boundary vectors expected 48, got ${boundaryRows.length}`);
const boundaryPairs=new Map();
for (const r of boundaryRows) {
  if (r.source_id!=="KASI_CALENDAR" || r.status!=="verified_boundary_vector") fail(`boundary vector source/status mismatch: ${r.year}/${r.term}`);
  const key=`${r.year}|${r.term}|${r.boundary_local}`;
  if (!boundaryPairs.has(key)) boundaryPairs.set(key,[]);
  boundaryPairs.get(key).push(r);
}
if (boundaryPairs.size!==24) fail(`expected 24 solar-term boundary pairs, got ${boundaryPairs.size}`);
for (const [key,rows] of boundaryPairs) {
  if (rows.length!==2) fail(`boundary pair row count: ${key}`);
  if (!rows.some(r=>r.relation_to_boundary==="one_minute_before") || !rows.some(r=>r.relation_to_boundary==="at_boundary")) fail(`boundary pair relation missing: ${key}`);
}
if (stats.myeongri?.solar_term_boundary_test_vectors!==boundaryRows.length) fail("stats solar-term boundary vector count mismatch");
ok(`saju boundary regression vectors: ${boundaryRows.length} rows / ${boundaryPairs.size} boundaries`);

const quality=JSON.parse(read("data/meta/quality-gates.json"));
const gateIds=new Set((quality.gates||[]).map(g=>g.gate_id));
for (const id of ["LEGAL_HANJA_OFFICIAL_FULL_DIFF","LEGAL_NAMING_RULES","DERIVED_DATA_REPRODUCIBILITY","HANJA_SEMANTIC_CURATION","NAMING_METHOD_DATA","SOLAR_TERMS_2026_2027","SAJU_CALCULATION_ENGINE","NAME_TREND_DATA","SURNAME_HANGNYEOL","SOURCE_LICENSE_AUDIT"]) if (!gateIds.has(id)) fail(`missing quality gate: ${id}`);
if (quality.gates.find(g=>g.gate_id==="LEGAL_HANJA_OFFICIAL_FULL_DIFF")?.status!=="pending_official_extraction") fail("legal Hanja gate must remain pending");
if (quality.gates.find(g=>g.gate_id==="SOLAR_TERMS_2026_2027")?.status!=="verified_official") fail("solar-term quality gate mismatch");
ok("quality gates present and conservative");

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
