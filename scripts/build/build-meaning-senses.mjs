import fs from "node:fs";
import {parseCsv,toCsv,checkOrWrite} from "./lib/csv.mjs";
const root=new URL("../../",import.meta.url);
const check=process.argv.includes("--check");
const rows=parseCsv(fs.readFileSync(new URL("data/hanja/enriched/legal-reading-meaning.csv",root),"utf8")).rows;
const relations=new Map();
for (const row of rows) {
  if (row.match_status!=="matched" || !row.meaning_ko) continue;
  const key=row.legal_reading+"|"+row.hanja+"|"+row.codepoint;
  if (!relations.has(key)) relations.set(key,row);
}
const out=[];
for (const row of relations.values()) {
  const parts=row.meaning_ko.split(/\s*,\s*/).filter(Boolean);
  parts.forEach((raw,i)=>{
    let core=raw; const suffix=" "+row.legal_reading; if (core.endsWith(suffix)) core=core.slice(0,-suffix.length);
    const relationId="U"+row.unicode+"-"+row.legal_reading;
    out.push({meaning_relation_id:relationId,sense_id:relationId+"-"+String(i+1).padStart(2,"0"),legal_reading:row.legal_reading,hanja:row.hanja,unicode:row.unicode,codepoint:row.codepoint,sense_order:i+1,relation_sense_count:parts.length,raw_sense:raw,gloss_core:core,multi_sense_relation:parts.length>1?"true":"false",meaning_source_id:"LIBHANGUL_HANJA",legal_relation_source_id:"RUTOPIO_NAME_HANJA",derivation_status:"mechanically_split_from_meaning_ko",review_status:"unreviewed_lexicographic_split"});
  });
}
const header=["meaning_relation_id","sense_id","legal_reading","hanja","unicode","codepoint","sense_order","relation_sense_count","raw_sense","gloss_core","multi_sense_relation","meaning_source_id","legal_relation_source_id","derivation_status","review_status"];
checkOrWrite(fs,new URL("data/hanja/semantics/meaning-senses.csv",root),toCsv(header,out),check);
