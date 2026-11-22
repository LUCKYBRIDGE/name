import fs from "node:fs";

const root = new URL("../../", import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), "utf8").replace(/^\uFEFF/, "");

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
function csvCell(v) {
  const s=String(v??"");
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s;
}

const PRIORITY = [
  "宇","安","恩","允","均","圭","坤","城","基","培","聖","延",
  "俊","智","知","炫","煥","熙","輝","彬","樹","秀","榮","賢",
  "建","東","松","河","海","潤","淳","泳","泰","浩","洙","準",
  "敏","玟","珉","瑞","珍","眞","正","成","承","善","宣","世",
  "修","現","憲","赫","玄","元","原","源","園","媛","妍","演",
  "然","悅","仁","雅","藝","禮","叡","羽","雨","友","優","裕",
  "胤","律","溫","辰","晉","健","旻","民","斌","皓","昊","峻",
  "濬","浚","勳","薰","誠","晟","星","貞","晶","靜","廷","庭"
];

const senseRows=csvRows("data/hanja/semantics/meaning-senses.csv");
const curated=csvRows("data/hanja/semantics/naming-meaning-curated.csv");
const curatedKeys=new Set(curated.map(r=>`${r.hanja}|${r.legal_reading}|${r.sense_order}`));

const rank=new Map(PRIORITY.map((h,i)=>[h,i+1]));
const rows=senseRows
  .filter(r=>rank.has(r.hanja))
  .sort((a,b)=>rank.get(a.hanja)-rank.get(b.hanja)
    || a.legal_reading.localeCompare(b.legal_reading,"ko")
    || Number(a.sense_order)-Number(b.sense_order))
  .map(r=>({
    priority_rank: rank.get(r.hanja),
    hanja:r.hanja,
    codepoint:r.codepoint,
    legal_reading:r.legal_reading,
    sense_order:r.sense_order,
    raw_sense:r.raw_sense,
    relation_sense_count:r.relation_sense_count,
    already_curated: curatedKeys.has(`${r.hanja}|${r.legal_reading}|${r.sense_order}`) ? "true" : "false",
    meaning_source_id:r.meaning_source_id,
    review_status:"pending_human_review"
  }));

const header=Object.keys(rows[0]||{
  priority_rank:"",hanja:"",codepoint:"",legal_reading:"",sense_order:"",raw_sense:"",
  relation_sense_count:"",already_curated:"",meaning_source_id:"",review_status:""
});
const out=[header.join(","),...rows.map(r=>header.map(h=>csvCell(r[h])).join(","))].join("\n")+"\n";
fs.writeFileSync(new URL("../../data/hanja/semantics/naming-curation-backlog.csv", import.meta.url),out,"utf8");

const covered=new Set(rows.map(r=>r.hanja));
const missing=PRIORITY.filter(h=>!covered.has(h));
console.log(`curation backlog: ${rows.length} senses / ${covered.size} characters; missing=${missing.join("")||"none"}`);
