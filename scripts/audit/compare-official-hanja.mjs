import fs from "node:fs";
import {parseCsv} from "../build/lib/csv.mjs";
const root=new URL("../../",import.meta.url);
const input=process.argv[2];
if(!input){console.error("Usage: node scripts/audit/compare-official-hanja.mjs <official-reading-character.csv> [output.json]");process.exit(2);}
const official=parseCsv(fs.readFileSync(input,"utf8")).rows;
const mirror=parseCsv(fs.readFileSync(new URL("data/hanja/normalized/by-reading.csv",root),"utf8")).rows;
const normUnicode=v=>{if(!v)return "";const s=String(v).toUpperCase().replace(/^U\+/,"").padStart(5,"0");return "U+"+s;};
const key=r=>(r.reading||r.legal_reading)+"|"+normUnicode(r.codepoint||r.unicode);
const officialMap=new Map(official.map(r=>[key(r),r]));
const mirrorMap=new Map(mirror.map(r=>[key(r),r]));
const officialOnly=[...officialMap.keys()].filter(k=>!mirrorMap.has(k)).map(k=>officialMap.get(k));
const mirrorOnly=[...mirrorMap.keys()].filter(k=>!officialMap.has(k)).map(k=>mirrorMap.get(k));
const common=[...officialMap.keys()].filter(k=>mirrorMap.has(k)).length;
const officialByCp=new Map(),mirrorByCp=new Map();
for(const r of official){const cp=normUnicode(r.codepoint||r.unicode);if(!cp)continue;if(!officialByCp.has(cp))officialByCp.set(cp,new Set());officialByCp.get(cp).add(r.reading||r.legal_reading);}
for(const r of mirror){const cp=normUnicode(r.codepoint||r.unicode);if(!cp)continue;if(!mirrorByCp.has(cp))mirrorByCp.set(cp,new Set());mirrorByCp.get(cp).add(r.reading);}
const readingMismatches=[];
for(const [cp,os] of officialByCp){if(!mirrorByCp.has(cp))continue;const a=[...os].sort(),b=[...mirrorByCp.get(cp)].sort();if(a.join("|")!==b.join("|"))readingMismatches.push({codepoint:cp,official_readings:a,mirror_readings:b});}
const result={generated_at:new Date().toISOString(),comparison_key:"reading + Unicode codepoint",warning:"Do not compare the 2024 court headline count directly with normalized codepoint/relation counts; compare rows and legal categories.",counts:{official_relations:officialMap.size,mirror_relations:mirrorMap.size,common,official_only:officialOnly.length,mirror_only:mirrorOnly.length,reading_mismatch_codepoints:readingMismatches.length},official_only:officialOnly,mirror_only:mirrorOnly,reading_mismatches:readingMismatches};
const output=process.argv[3];if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n","utf8");else process.stdout.write(JSON.stringify(result,null,2)+"\n");
