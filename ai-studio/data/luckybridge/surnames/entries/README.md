# 성씨 상세 엔트리 스키마

`entries/<한자>.json`은 앱이나 AI가 한 성씨를 바로 조회할 때 사용하는 상세 레코드다.

## 공통 필수 영역
- `surname_id`
- `identity`: 한글·한자·Unicode·성씨 독음·문자 독음
- `character_metadata`: 사전형 훈·부수·기술 총획
- `census_2015`: 2015-11-01 인구·순위
- `pronunciation`: 음절 초성·중성·종성·CV/CVC
- `romanization`: 국어의 로마자 표기법 기준형
- `representative_clans_2015`: 공식 보도자료에서 확인된 대표 본관(부분 자료)
- `clans_2015_summary`: 주요 본관 최대 7개 + 계산 나머지, 남/여 인구와 성씨 내 비율 포함
- `genealogy_research`: 대표 본관의 시조·원조·중시조·계통 연구와 근거 수준
- `stroke_policy`: 기술 총획과 성명학 획수의 분리
- `naming_policy`: 성씨를 이름자와 다르게 처리하는 규칙
- `research_status`: 전체 본관·항렬 등 미완성 영역
- `verification`: 자료별 검증 상태

## genealogy_research
각 항목은 다음을 유지한다.
- `bongwan`
- `claim_type`
- `person` (있을 때만)
- `claim`
- `evidence_level`
- `source_ids`
- `caveat`
- `do_not_infer_beyond_source: true`

### claim_type 예
- `founder_reference`: 비교적 명확한 시조 참고
- `founder_tradition`: 족보·문중 전승
- `progenitor_reference`: 원조
- `middle_ancestor_reference`: 중시조
- `branch_founder_reference`: 분관 시조
- `historical_clan_reference`: 역사적 씨족 참고
- `genealogy_documentation`: 족보·계통 문헌 존재 확인
- `founder_mythic_tradition`, `founder_legend`: 신화·설화
- `*_conflict`, `*_variant`: 출처 충돌·계통 변형

## 중요
1. 시조·원조·중시조·분관조를 같은 값으로 합치지 않는다.
2. 설화나 족보 전승을 정사·법적 사실로 승격하지 않는다.
3. 출처 충돌을 임의로 해결하지 않는다.
4. `technical_total_strokes`는 수리성명학의 기본 획수가 아니다.
5. `representative_clans_2015`는 전체 본관 목록이 아니다.
6. 한글 성씨가 같아도 한자가 다르면 다른 `surname_id`를 사용한다.
7. 항렬·돌림자는 검증된 문중별 출처가 없으면 생성하지 않는다.

현재 31개 모든 엔트리가 2015 주요 본관 요약을 가지며 그 합계는 성씨 전체 인구와 일치한다. 徐의 기존 본관 상세 구조도 보존한다. 다만 전체 5인 이상 본관 원자료와 항렬 완성도는 `research-status.csv`에서 별도 관리한다.
