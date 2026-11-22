import fs from "node:fs";
import {parseCsv,toCsv,checkOrWrite} from "../build/lib/csv.mjs";
const root=new URL("../../", import.meta.url);
const check=process.argv.includes("--check");
const rows=parseCsv(fs.readFileSync(new URL("data/meta/sources.csv",root),"utf8")).rows;

const namedLicenses=new Set(["BSD-3-Clause","MIT","Unicode-3.0-License"]);

const output=rows.map(r=>{
  let license_metadata_status="repository_policy_label";
  let redistribution_review_status="manual_review_before_bulk_redistribution";
  let reference_use_status="metadata_and_citation_reference_ok";
  let audit_priority="low";
  let notes="등록된 정책 라벨의 실제 적용 범위는 재배포 시 다시 확인";

  if(r.license==="unknown"){
    license_metadata_status="unknown";
    audit_priority=/^official_(service|law|document)$/.test(r.authority)?"high":"medium";
    notes="출처 링크를 참고·인용하는 것과 원문/데이터 대량 재배포 권한은 별도 검토";
  } else if(namedLicenses.has(r.license)){
    license_metadata_status="named_license";
    redistribution_review_status="permitted_with_registered_license_notice";
    notes="저장소의 해당 라이선스 원문·고지와 적용 범위를 함께 유지";
  } else if(r.license==="KOGL-1-text"){
    license_metadata_status="verified_public_license";
    redistribution_review_status="permitted_for_text_with_required_attribution";
    notes="한국민족문화대백과 텍스트: 공공누리 제1유형, 항목명과 ⓒ한국민족문화대백과사전 출처표시 필요; 미디어 제외";
  } else if(r.license==="KOGL-1-calendar-info"){
    license_metadata_status="verified_public_license";
    redistribution_review_status="permitted_with_attribution_within_calendar_info_scope";
    notes="한국천문연구원 공공누리 제1유형 표시 범위의 달력면 천문정보에 한함; 사진·전체 디자인은 별도";
  } else if(r.license==="KOSIS-statistics-use-guide"){
    license_metadata_status="verified_official_use_policy";
    redistribution_review_status="permitted_for_KOSIS_statistics_with_source_and_integrity_conditions";
    notes="KOSIS 통계정보는 자유 이용 가능하나 출처 정확성·비왜곡·관련 법령 조건 준수";
  } else if(r.license==="public_law"){
    license_metadata_status="statutory_noncopyrightable_official_law_text";
    redistribution_review_status="official_law_text_reuse_allowed_scope_only";
    notes="저작권법 제7조상 법령·규칙 원문은 보호받지 못하는 저작물에 해당; 사이트 편집·해설·이미지는 별도";
  } else if(r.license==="public_work_free_use_with_attribution"){
    license_metadata_status="official_copyright_policy_verified";
    redistribution_review_status="normalized_factual_statistics_allowed_with_specific_attribution";
    reference_use_status="official_statistics_reuse_verified";
    notes="법원이 저작재산권 전부를 보유한 공공저작물의 자유이용 정책과 구체적 출처표시 의무를 적용; 조회조건·조회일·잠정치 여부를 보존";
  } else if(r.license==="first_party_all_rights_reserved"){
    license_metadata_status="first_party";
    redistribution_review_status="first_party_repository_use_allowed";
    reference_use_status="regression_and_migration_only";
    notes="LUCKYBRIDGE 자체 역사 구현 또는 편집 자료; 외부 근거로 오인하지 않음";
  } else if(r.license==="PDM"){
    license_metadata_status="item_marked_pdm";
    redistribution_review_status="page_level_review_before_bulk_transcription";
    reference_use_status="metadata_and_primary_source_reference_ok";
    audit_priority="medium";
    notes="NDL 항목의 PDM 표시를 기록하되 실제 표·본문 전사 전 페이지·항목별 이용조건을 재확인";
  }

  if(r.source_id==="KCI_RESOURCE_ELEMENT_214_2024"){
    audit_priority="high";
    notes="214부수 전체 자원오행 배속 연구라는 점은 검증됨; 학술논문 표 원문 재배포는 하지 않으며 독립 재구성 또는 허가가 필요";
  }
  if(r.source_id==="NDL_KUMASAKI_SEIMEI_NO_SHINPI_1929"){
    reference_use_status="metadata_and_primary_source_reference_ok";
    notes="1929 1차 서지 원전. 디지털 본문은 관내·개인송신 대상이므로 일반 공개 원문으로 취급하거나 자동 전사하지 않음";
  }

  return {
    source_id:r.source_id, authority:r.authority, license:r.license,
    license_metadata_status, redistribution_review_status,
    reference_use_status, audit_priority, notes
  };
});
const header=["source_id","authority","license","license_metadata_status","redistribution_review_status","reference_use_status","audit_priority","notes"];
checkOrWrite(fs,new URL("data/meta/source-audit.csv",root),toCsv(header,output),check);
