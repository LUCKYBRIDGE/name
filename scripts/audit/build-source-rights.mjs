import fs from "node:fs";
import {parseCsv,toCsv,checkOrWrite} from "../build/lib/csv.mjs";

const root=new URL("../../", import.meta.url);
const check=process.argv.includes("--check");
const rows=parseCsv(fs.readFileSync(new URL("data/meta/sources.csv",root),"utf8")).rows;

function classify(r) {
  const id=r.source_id;
  const license=r.license;

  if (id==="RUTOPIO_NAME_HANJA") {
    return {
      rights_class:"embedded_open_license_upstream_rights_review",
      repository_use:"existing_candidate_mirror_and_derivatives",
      app_use:"verify_court_origin_reuse_before_new_public_bundles",
      redistribution_basis:"Upstream mirror declares MIT; underlying court-origin bulk reuse has not been verified",
      attribution_required:"true", attribution_template:"rutopio MIT 고지와 대법원 원천 출처를 함께 유지",
      embedded_source_content:"true", broad_release_action:"retain_mit_notice_and_verify_original_court_data_reuse"
    };
  }
  if (["LIBHANGUL_HANJA","UNICODE_UNIHAN"].includes(id)) {
    return {
      rights_class:"embedded_open_license", repository_use:"embedded_source_and_derivatives",
      app_use:"allowed_with_license_notice", redistribution_basis:license,
      attribution_required:"true", attribution_template:"제3자 라이선스 고지: THIRD_PARTY_NOTICES.md 및 LICENSES/ 참조",
      embedded_source_content:"true", broad_release_action:"keep_license_and_copyright_notices"
    };
  }
  if (id==="KNOLNAME_LEGACY_81" || id==="KNOLNAME2_DATALOADER_LEGACY") {
    return {
      rights_class:"first_party_legacy_implementation", repository_use:"embedded_for_regression_and_migration",
      app_use:"allowed_but_not_authoritative_for_scoring", redistribution_basis:"LUCKYBRIDGE first-party historical implementation",
      attribution_required:"false", attribution_template:`LUCKYBRIDGE/${id==="KNOLNAME_LEGACY_81"?"knolname":"knolname2"} legacy implementation`,
      embedded_source_content:"true", broad_release_action:"keep_non_authoritative_status_and_do_not_present_as_external_evidence"
    };
  }
  if (id==="LUNAR_PYTHON") {
    return {
      rights_class:"reference_only_open_source", repository_use:"implementation_crosscheck_only",
      app_use:"no_upstream_code_embedded_by_default", redistribution_basis:"MIT reference only unless code is copied",
      attribution_required:"false", attribution_template:"코드를 실제 포함할 경우 MIT 저작권·라이선스 고지 추가",
      embedded_source_content:"false", broad_release_action:"verify_no_upstream_code_was_copied_or_add_MIT_notice"
    };
  }
  if (id==="KR_COURT_FAMILY_STATS") {
    return {
      rights_class:"official_statistics_reuse_policy",
      repository_use:"official_statistical_facts_and_normalized_snapshots_allowed_with_specific_source_attribution",
      app_use:"allowed_with_specific_source_attribution_and_query_scope_date",
      redistribution_basis:"대한민국 법원 저작권 보호 정책상 법원 보유 공공저작물 자유이용 + 구체적 출처표시",
      attribution_required:"true",
      attribution_template:"출처: 대한민국 법원 전자가족관계등록 통계서비스, 「상위 출생신고 이름 현황」 또는 「상위 개명신고 이름 현황」 (조회조건·조회일 병기)",
      embedded_source_content:"false",
      broad_release_action:"store normalized factual rows with exact query scope, registration-date basis, retrieval date and source attribution"
    };
  }
  if (license==="KOSIS-statistics-use-guide") {
    return {
      rights_class:"official_statistics_reuse_policy", repository_use:"official_statistics_and_repository_derivatives",
      app_use:"allowed_with_source_and_integrity_conditions", redistribution_basis:"KOSIS statistics use guide",
      attribution_required:"true", attribution_template:`출처: 국가데이터처 국가통계포털(KOSIS), 「${r.title}」`,
      embedded_source_content:"false", broad_release_action:"keep_source_and_do_not_distort_statistics"
    };
  }
  if (license==="KOGL-1-text") {
    return {
      rights_class:"public_text_KOGL_type1", repository_use:"text_reference_and_editorial_summary",
      app_use:"allowed_with_article_level_attribution", redistribution_basis:"공공누리 제1유형(텍스트)",
      attribution_required:"true", attribution_template:`출처: 「${r.title}」, ⓒ한국민족문화대백과사전`,
      embedded_source_content:"false", broad_release_action:"keep_article_attribution_and_verify_media_separately"
    };
  }
  if (license==="KOGL-1-calendar-info") {
    return {
      rights_class:"public_calendar_KOGL_type1_scoped", repository_use:"calendar_face_astronomical_facts_only",
      app_use:"allowed_with_attribution_within_verified_scope", redistribution_basis:"공공누리 제1유형(달력면 천문정보 범위)",
      attribution_required:"true", attribution_template:`출처: 한국천문연구원, 「${r.title}」`,
      embedded_source_content:"false", broad_release_action:"verify_scope_excludes_photos_design_and_full_almanac"
    };
  }
  if (license==="public_law") {
    return {
      rights_class:"statutory_official_text", repository_use:"legal_text_and_rule_reference",
      app_use:"allowed_with_scope_limited_to_official_legal_text", redistribution_basis:"저작권법 제7조 범위",
      attribution_required:"false", attribution_template:`근거: ${r.publisher}, 「${r.title}」`,
      embedded_source_content:"false", broad_release_action:"do_not_extend_statutory_exclusion_to_commentary_UI_or_media"
    };
  }
  if (id==="KR_COURT_HANJA" || id==="KR_COURT_HANJA_PDF") {
    return {
      rights_class:"official_reference_bulk_reuse_unverified", repository_use:"current_legal_verification_reference_only",
      app_use:"link_and_final_verification_guidance_only", redistribution_basis:"bulk redistribution permission not verified",
      attribution_required:"true", attribution_template:`확인: 대한민국 법원, 「${r.title}」`,
      embedded_source_content:"false", broad_release_action:"manual_review_before_bulk_embedding_or_redistribution"
    };
  }
  if (id==="NDL_KUMASAKI_SEIMEI_TETSURI_1933") {
    return {
      rights_class:"reference_terms_not_item_verified", repository_use:"primary_source_metadata_and_manual_transcription_reference",
      app_use:"derived_facts_or_verified_transcription_only", redistribution_basis:"NDL item marked PDM; page-level scope rechecked at transcription time",
      attribution_required:"true", attribution_template:"원전: 熊崎健翁, 『姓名の哲理』11版, 五聖閣出版局, 1933 (国立国会図書館)",
      embedded_source_content:"false", broad_release_action:"verify_page_level_source_and_terms_before_bulk_transcription"
    };
  }
  if (id==="NDL_KUMASAKI_SEIMEI_NO_SHINPI_1929") {
    return {
      rights_class:"reference_terms_not_item_verified", repository_use:"primary_bibliographic_reference_only",
      app_use:"bibliographic_provenance_and_derived_facts_only", redistribution_basis:"digitized content access restricted; content reuse not verified",
      attribution_required:"true", attribution_template:"원전 서지: 熊崎健翁, 『姓名の神秘 : 運命判斷』, 實業之日本社, 1929 (国立国会図書館)",
      embedded_source_content:"false", broad_release_action:"do_not_embed_or_transcribe_restricted_content_without_lawful_access_and_rights_review"
    };
  }
  if (r.authority==="academic") {
    return {
      rights_class:"academic_reference_only", repository_use:"citation_crosscheck_and_original_summary_only",
      app_use:"no_article_text_tables_figures_embedded", redistribution_basis:"article rights not verified for republication",
      attribution_required:"true", attribution_template:`참고문헌: ${r.publisher}, 「${r.title}」`,
      embedded_source_content:"false", broad_release_action:"manual_review_before_quoting_or_republishing_article_content"
    };
  }
  if (id.startsWith("SECONDARY_ROOTSINFO_") || id==="YESJOKBO_CENSUS2015_APPENDIX") {
    return {
      rights_class:"secondary_reference_only", repository_use:"crosscheck_metadata_and_original_summary_only",
      app_use:"do_not_embed_source_document_or_database", redistribution_basis:"reuse permission not verified",
      attribution_required:"true", attribution_template:`보조 참고: ${r.publisher}, 「${r.title}」`,
      embedded_source_content:"false", broad_release_action:"replace_with_official_or_clearly_licensed_source_where_possible"
    };
  }

  return {
    rights_class:"reference_terms_not_item_verified", repository_use:"factual_reference_metadata_and_original_summary_only",
    app_use:"derived_fact_or_link_only_unless_item_terms_verified", redistribution_basis:`source label: ${license}; item-level reuse not verified`,
    attribution_required:"true", attribution_template:`출처: ${r.publisher}, 「${r.title}」`,
    embedded_source_content:"false", broad_release_action:"verify_item_level_terms_before_copying_source_expression_or_database"
  };
}

const output=rows.map(r=>({ source_id:r.source_id, ...classify(r), source_url:r.url, verified_on:r.accessed_at }));
const header=["source_id","rights_class","repository_use","app_use","redistribution_basis","attribution_required","attribution_template","embedded_source_content","broad_release_action","source_url","verified_on"];
checkOrWrite(fs,new URL("data/meta/source-rights.csv",root),toCsv(header,output),check);
