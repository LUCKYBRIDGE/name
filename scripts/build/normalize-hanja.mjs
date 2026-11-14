import fs from "node:fs";
import {parseCsv,toCsv,checkOrWrite} from "./lib/csv.mjs";
const root=new URL("../../",import.meta.url);
const check=process.argv.includes("--check");
const raw=parseCsv(fs.readFileSync(new URL("data/hanja/raw/rutopio-data-gov-2024-07-16.csv",root),"utf8"));
const byMap=new Map(), charsMap=new Map();
for (const row of raw.rows) {
  const unicode=(row.unicode||"").toUpperCase().padStart(5,"0");
  const codepoint="U+"+unicode, hanja=row.hanja;
  if (!charsMap.has(codepoint)) charsMap.set(codepoint,{unicode,codepoint,hanja,readings:new Set()});
  const readings=(row.hangul||"").split(",").map(v=>v.trim()).filter(Boolean);
  for (const reading of readings) {
    charsMap.get(codepoint).readings.add(reading);
    byMap.set(reading+"|"+codepoint,{reading,unicode,codepoint,hanja,source:"rutopio/Korean-Name-Hanja-Charset:data-gov.csv"});
  }
}
const byRows=[...byMap.values()].sort((a,b)=>a.reading.localeCompare(b.reading,"ko")||a.codepoint.localeCompare(b.codepoint));
const characterRows=[...charsMap.values()].sort((a,b)=>a.codepoint.localeCompare(b.codepoint)).map(r=>({
  unicode:r.unicode,codepoint:r.codepoint,hanja:r.hanja,
  readings:[...r.readings].sort((a,b)=>a.localeCompare(b,"ko")).join("|"),reading_count:r.readings.size,
  source:"rutopio/Korean-Name-Hanja-Charset:data-gov.csv"
}));
checkOrWrite(fs,new URL("data/hanja/normalized/by-reading.csv",root),toCsv(["reading","unicode","codepoint","hanja","source"],byRows,{bom:true}),check);
checkOrWrite(fs,new URL("data/hanja/normalized/characters.csv",root),toCsv(["unicode","codepoint","hanja","readings","reading_count","source"],characterRows,{bom:true}),check);
