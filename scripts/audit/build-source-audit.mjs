import fs from "node:fs";
import {parseCsv,toCsv,checkOrWrite} from "../build/lib/csv.mjs";
const root=new URL("../../",import.meta.url);
const check=process.argv.includes("--check");
const rows=parseCsv(fs.readFileSync(new URL("data/meta/sources.csv",root),"utf8")).rows;
const named=new Set(["BSD-3-Clause","MIT","Unicode-3.0-License"]);
const output=rows.map(r=>{
  let st="repository_policy_label"; if(r.license==="unknown") st="unknown"; else if(named.has(r.license)) st="named_license";
  const high=/^official_(service|law|document)$/.test(r.authority)&&r.license==="unknown";
  return {source_id:r.source_id,authority:r.authority,license:r.license,license_metadata_status:st,redistribution_review_status:st==="named_license"?"named_license_registered_scope_review_if_republishing":"manual_review_before_bulk_redistribution",reference_use_status:"metadata_and_citation_reference_ok",audit_priority:high?"high":r.license==="unknown"?"medium":"low",notes:r.license==="unknown"?"출처 링크를 참고·인용하는 것과 원문/데이터 대량 재배포 권한은 별도 검토":"등록된 라이선스/정책 라벨의 실제 적용 범위는 재배포 전에 확인"};
});
const header=["source_id","authority","license","license_metadata_status","redistribution_review_status","reference_use_status","audit_priority","notes"];
checkOrWrite(fs,new URL("data/meta/source-audit.csv",root),toCsv(header,output),check);
