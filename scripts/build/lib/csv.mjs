export function parseCsvLine(line) {
  const out=[]; let cur=""; let quoted=false;
  for (let i=0;i<line.length;i++) {
    const ch=line[i];
    if (ch === '"') {
      if (quoted && line[i+1] === '"') { cur += '"'; i++; } else quoted=!quoted;
    } else if (ch === "," && !quoted) { out.push(cur); cur=""; } else cur += ch;
  }
  out.push(cur); return out;
}

export function parseCsv(content) {
  const lines=content.replace(/^\uFEFF/,"").trimEnd().split(/\r?\n/);
  const header=parseCsvLine(lines[0]);
  return {header,rows:lines.slice(1).filter(Boolean).map(line=>{
    const values=parseCsvLine(line);
    return Object.fromEntries(header.map((h,i)=>[h,values[i]??""]));
  })};
}

export function csvEscape(value) {
  const s=String(value??"");
  return /[",\n\r]/.test(s) ? '"'+s.replaceAll('"','""')+'"' : s;
}

export function toCsv(header, rows, options={}) {
  const body=[header.map(csvEscape).join(","),...rows.map(r=>header.map(h=>csvEscape(r[h])).join(","))].join("\n")+"\n";
  return (options.bom ? "\uFEFF" : "") + body;
}

export function checkOrWrite(fs,target,generated,check) {
  if (check) {
    const current=fs.readFileSync(target,"utf8");
    if (current!==generated) { console.error("Generated file differs: "+target.pathname); process.exitCode=1; return false; }
    console.log("OK generated: "+target.pathname); return true;
  }
  fs.writeFileSync(target,generated,"utf8"); console.log("WROTE: "+target.pathname); return true;
}
