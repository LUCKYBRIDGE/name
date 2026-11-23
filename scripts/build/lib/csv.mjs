export function parseCsv(content) {
  const input = content.replace(/^\uFEFF/, "");
  const unquotedField = /[^",\r\n]*/y;
  const records = [];
  let offset = 0;

  while (offset < input.length) {
    const fields = [];
    if (input[offset] !== "\n" && input[offset] !== "\r") {
      while (true) {
        if (input[offset] === '"') {
          const start = offset + 1;
          let closingQuote = input.indexOf('"', start);
          while (closingQuote !== -1 && input[closingQuote + 1] === '"') {
            closingQuote = input.indexOf('"', closingQuote + 2);
          }
          if (closingQuote === -1) {
            throw new Error(`CSV record ${records.length + 1}: unclosed quoted field`);
          }
          fields.push(input.slice(start, closingQuote).replaceAll('""', '"'));
          offset = closingQuote + 1;
        } else {
          unquotedField.lastIndex = offset;
          fields.push(unquotedField.exec(input)[0]);
          offset = unquotedField.lastIndex;
        }
        if (input[offset] !== ",") break;
        offset++;
      }
      records.push(fields);
    }

    if (offset === input.length) break;
    if (input.startsWith("\r\n", offset)) {
      offset += 2;
    } else if (input[offset] === "\n" || input[offset] === "\r") {
      offset++;
    } else {
      throw new Error(`CSV record ${records.length}: unexpected character after field`);
    }
  }

  const [header, ...values] = records;
  if (!header || header.some(name => !name.trim())) throw new Error("CSV header is missing or has an empty column");
  if (new Set(header).size !== header.length) throw new Error("CSV header has duplicate columns");

  const rows = values.map((fields, index) => {
    if (fields.length !== header.length) {
      throw new Error(`CSV record ${index + 2}: expected ${header.length} fields, got ${fields.length}`);
    }
    return Object.fromEntries(header.map((name, fieldIndex) => [name, fields[fieldIndex]]));
  });
  return { header, rows };
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
