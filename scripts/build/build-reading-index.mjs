import fs from "node:fs";
import {parseCsv,checkOrWrite} from "./lib/csv.mjs";
const root=new URL("../../",import.meta.url);
const check=process.argv.includes("--check");
const rows=parseCsv(fs.readFileSync(new URL("data/hanja/normalized/by-reading.csv",root),"utf8")).rows;
const stats=JSON.parse(fs.readFileSync(new URL("data/meta/dataset-stats.json",root),"utf8"));
const readings={};
for (const r of rows) (readings[r.reading]??=[]).push({u:r.codepoint,h:r.hanja});
const h=stats.hanja;
const meta={
  source:"rutopio/Korean-Name-Hanja-Charset data-gov.csv",upstream_source:"Supreme Court of Korea e-Family personal-name Hanja lookup",
  upstream_crawl_date:h.upstream_crawl_date,imported_at:stats.generated_at,normalized_at:stats.generated_at,
  status:"secondary_mirror; verify legal use against current official source",source_row_count:h.source_row_count,
  raw_expanded_reading_relations:h.raw_expanded_reading_relations,normalized_reading_relations:h.normalized_reading_relations,
  duplicate_relations_removed:h.duplicate_reading_relations_removed,unique_codepoints:h.unique_codepoints,
  codepoints_with_readings:h.codepoints_with_readings,codepoints_without_reading:h.codepoints_without_reading,distinct_readings:h.distinct_readings
};
checkOrWrite(fs,new URL("data/hanja/normalized/reading-index.json",root),JSON.stringify({meta,readings},null,2)+"\n",check);
