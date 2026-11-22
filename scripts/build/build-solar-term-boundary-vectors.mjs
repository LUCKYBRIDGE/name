import fs from "node:fs";

const root=new URL("../../", import.meta.url);
const pad=n=>String(n).padStart(2,"0");
const parse=p=>{
  const lines=fs.readFileSync(new URL(p,root),"utf8").replace(/^\uFEFF/,"").trim().split(/\r?\n/);
  const h=lines[0].split(",");
  return lines.slice(1).map(line=>Object.fromEntries(h.map((k,i)=>[k,line.split(",")[i]??""])));
};
const startMap=[
  ["입춘","인","寅","축","丑"],["경칩","묘","卯","인","寅"],["청명","진","辰","묘","卯"],
  ["입하","사","巳","진","辰"],["망종","오","午","사","巳"],["소서","미","未","오","午"],
  ["입추","신","申","미","未"],["백로","유","酉","신","申"],["한로","술","戌","유","酉"],
  ["입동","해","亥","술","戌"],["대설","자","子","해","亥"],["소한","축","丑","자","子"]
];
const out=[];
for(const year of [2026,2027]){
  const terms=parse(`data/time/${year}_24절기_KASI.csv`);
  for(const [term,newH,newB,prevH,prevB] of startMap){
    const t=terms.find(x=>x.term===term);
    if(!t) throw new Error(`missing term ${year}/${term}`);
    const boundary=`${t.year}-${pad(t.month)}-${pad(t.day)}T${pad(t.hour)}:${pad(t.minute)}:00+09:00`;
    const utc=new Date(Date.UTC(Number(t.year),Number(t.month)-1,Number(t.day),Number(t.hour)-9,Number(t.minute)));
    const before=new Date(utc.getTime()-60000);
    const k=new Date(before.getTime()+9*3600000);
    const beforeText=`${k.getUTCFullYear()}-${pad(k.getUTCMonth()+1)}-${pad(k.getUTCDate())}T${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}:00+09:00`;
    out.push([year,term,boundary,beforeText,"one_minute_before",prevH,prevB,"KASI_CALENDAR","verified_boundary_vector"]);
    out.push([year,term,boundary,boundary,"at_boundary",newH,newB,"KASI_CALENDAR","verified_boundary_vector"]);
  }
}
const header="year,term,boundary_local,probe_local,relation_to_boundary,expected_month_branch_hangul,expected_month_branch,source_id,status";
fs.writeFileSync(new URL("tests/사주-절기경계-검증.csv",root),header+"\n"+out.map(r=>r.join(",")).join("\n")+"\n","utf8");
console.log(`wrote ${out.length} solar-term boundary vectors`);
