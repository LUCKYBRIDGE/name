# NAME — AI 작명 데이터베이스 사용 지침

이 저장소는 한국식 작명 앱과 AI 분석을 위한 **구조화 데이터베이스 + 지식베이스**다.

## 시작 순서
1. `INDEX.md`에서 요청 유형별 우선 자료를 찾는다.
2. 데이터 개수·상태는 `data/meta/dataset-stats.json`을 기준으로 한다.
3. 외부 근거는 `data/meta/sources.csv`의 `source_id`와 `sources/` 문서를 확인한다.
4. 추천·분석은 `workflows/`를 따른다.
5. 최종 답변은 `templates/분석-출력-형식.md`을 따른다.

## 데이터 우선순위
- 고정 계산값은 설명 문장으로 추론하지 말고 먼저 `data/`의 CSV/JSON을 조회한다.
- 한자 후보 탐색은 `data/hanja/normalized/reading-index.json` 또는 통합 마스터를 사용한다.
- 한자 뜻은 정확 독음-한자 결합 데이터가 있을 때만 사용한다.
- 뜻 조회는 `(한자, legal_reading)`을 키로 `data/hanja/semantics/meaning-senses.csv`를 우선 확인한다.
- Unicode 기술 획수는 성명학 획수로 자동 변환하지 않는다.
- 학파별 결과는 반드시 `method_id`를 유지한다.

## 강제 규칙
- 자료에 없는 한자 뜻·허용 여부·획수·사주팔자를 지어내지 않는다.
- 후보 검색용 인명용 한자 미러만 보고 현재 출생신고 가능 여부를 확정하지 않는다.
- 법적 판정은 대법원 현행 조회와 현행 규칙을 최우선으로 한다.
- 성명학 학파 차이를 숨기거나 결과를 하나의 절대 점수로 합치지 않는다.
- 사주 해석을 과학적 미래예측이라고 주장하지 않는다.
- 출생시각·달력체계·윤달·출생지 등 계산에 필요한 정보가 없으면 결과 범위를 제한한다.
- 경계 사례는 한 가지 결과로 강제하지 않고 방법론별 결과를 병렬 제시한다.
- 사용자 개인정보를 외부 서비스에 불필요하게 전송하지 않는다.

## 저작권·재배포 강제 규칙
- 외부 자료를 추가하기 전에 `data/meta/sources.csv`에 source_id와 이용조건을 등록한다.
- `COPYRIGHT_AND_DATA_USE.md`와 `data/meta/distribution-policy.csv`를 확인하지 않고 제3자 원문·표·이미지·PDF·데이터베이스를 저장소에 복제하지 않는다.
- MIT/BSD/Unicode 자료는 `THIRD_PARTY_NOTICES.md`와 해당 라이선스 고지를 유지한다.
- KOSIS 통계는 출처를 정확히 표시하고 통계수치·의미를 왜곡하지 않는다.
- `AKS_*` 텍스트를 앱 설명 근거로 쓰면 항목별로 `출처: 「항목명」, ⓒ한국민족문화대백과사전`을 표시한다. 사진·도판·영상은 별도 이용조건을 확인한다.
- KASI 자료는 공공누리 제1유형이 확인된 달력면 천문정보 범위만 사용하고 한국천문연구원을 출처로 표시한다.
- KCI 논문, YESJOKBO, SECONDARY_ROOTSINFO 및 이용조건 미확인 출처는 원문·표·도표를 복제하지 않고 참고·교차검증·자체 요약에만 사용한다.
- `data/surnames/clans-core-2015.csv`는 광범위 공개/상업 배포 전에 KOSIS 공식 원자료만으로 재생성 또는 재검증한다.
- 공공기관 사이트라는 이유만으로 자동으로 자유이용 자료라고 판단하지 않는다.
- 앱에 데이터를 배포할 때 `APP_ATTRIBUTION.md`의 고지를 반영한다.

## 인명용 한자
후보 탐색:
- `data/hanja/normalized/by-reading.csv`
- `data/hanja/normalized/characters.csv`
- `data/hanja/normalized/reading-index.json`
- `data/hanja/enriched/hanja-master-enriched.csv`

다중 의미·작명 의미:
- `data/hanja/semantics/meaning-senses.csv`: 전수 의미 항목
- `data/hanja/semantics/naming-meaning-curated.csv`: 사람이 검토한 작명용 의미 분류
- `knowledge/20-한자-다중의미-작명해석.md`: 의미 선택·풀이 원칙

의미 처리 강제 규칙:
- 대표 훈 하나만 보고 그 글자의 유일한 뜻이라고 말하지 않는다.
- 같은 글자라도 독음이 다르면 의미 목록을 합치지 않는다.
- 사용자가 이름에서 중심으로 삼을 뜻은 문서화된 의미 항목 안에서 선택하고 `selected_sense_ids`로 보존한다.
- 선택 주체와 근거를 `selection_origin`에 기록하며, 기존 이름에서 의도를 모르면 `unknown`으로 둔다.
- 선택하지 않은 다른 사전형 뜻도 존재하면 숨기지 않는다.
- `interpretation_template`은 사전 정의가 아니라 편집된 작명 풀이임을 구분한다.
- `caution_other_dictionary_sense`는 대표 긍정 의미로 자동 사용하지 않는다.
- `semantic_risk`는 길흉 점수나 자동 탈락 점수가 아니다. 같은 독음의 다른 뜻을 설명하기 위한 주의 수준이며, 원칙적으로 `invalid`만 선택 차단 사유다.
- 사전에 없는 길상 의미를 생성하거나 다른 한자의 뜻을 전이하지 않는다.

현행 법적 판정:
- `knowledge/05-인명용한자-법적판정.md`
- `sources/공식-인명용한자-근거-2026-11.md`

## 성씨 처리
- 성씨 기본 조회는 `data/surnames/surnames.csv`, 상세 조회는 `data/surnames/entries/<한자>.json`을 사용한다.
- 현재 코어 범위는 2015 총조사 순위 1~31위 31개 성씨다.
- 한글 성씨만 보고 한자를 임의 확정하지 않는다. 특히 조(趙/曺), 유(柳/劉)처럼 동음 성씨를 분리한다.
- 李·林·柳·梁·劉처럼 두음법칙/복수 독음이 있는 한자는 상세 엔트리의 `character_readings`와 `surname_reading`을 구분해 보존한다.
- 성씨의 사전 뜻을 이름자의 의미 점수처럼 합산하지 않는다.
- 본관은 가족 맥락이며 자동 길흉 점수로 사용하지 않는다.
- 일반 본관 요약은 `clans-core-2015.csv`를 사용한다. 각 성씨별 최대 7개 주요 본관과 계산 나머지로 성씨 전체 인구를 정확히 닫는다.
- `representative-clans-2015.csv`는 공식 보도자료의 대표 본관 부분 자료다.
- `clans-core-2015.csv`의 `상위 본관 외 나머지`는 원자료의 `기타`가 아니라 계산 파생값이므로 둘을 동일시하지 않는다.
- KOSIS의 `성씨ㆍ본관별 인구(5인 이상) - 전국`에는 더 작은 본관까지 존재하므로, 요약표를 전체 원자료라고 표현하지 않는다.
- 기술 총획은 성명학용 기본 획수가 아니다. `stroke-policies.csv`에서 numerology_default_count가 비어 있으면 method_id 없이 수리 계산하지 않는다.
- 성-이름 경계 발음은 `pronunciation-profiles.csv`의 종성 여부를 먼저 보고 실제 표준발음 규칙을 적용한다.
- 성과 이름 첫 음절이 같아도 자동 탈락시키지 않는다.
- 실제 여권 로마자 성은 규칙형을 자동 강제하지 않고 기존 사용 이력과 외교부 규정을 우선한다.
- 본관 역사 서술은 `clan-history.csv`와 상세 JSON의 `genealogy_research`에서 근거 수준과 caveat를 유지한다.
- 시조(founder), 원조(progenitor), 중시조(middle ancestor), 분관조(branch founder)를 같은 개념으로 합치지 않는다.
- `evidence_level`이 myth/folklore/tradition/conflict 계열이면 역사적 확정 사실로 승격하지 않는다.
- 출처가 충돌하는 洪·梁·孫·白 등의 계통 정보는 어느 한쪽으로 자동 결정하지 않는다.
- 항렬·돌림자는 `research-status.csv`에서 검증 완료 상태가 아닌 한 생성·추정하지 않는다.

## 명리 계산
고정 규칙은 `data/myeongri/`의 표를 우선한다. 지장간·십성·합충형파해·월지경계·오호둔·오서둔·십이운성은 데이터 표를 조회하고, 용신·격국·신강신약 등은 방법론을 먼저 선택한다.

## 출생일시
기록된 시·분, 출생지, 당시 시간대, DST, 절입 경계를 확인한다. 자시 경계와 진태양시 보정은 학파별 옵션으로 분리한다. 출생 전에는 사주를 확정하지 않는다.

## 실사용성
법적 적합성, 발음, 의미, 한자 난이도, 디지털 표시, 이름 유행도, 항렬자, 로마자 표기와 국제 사용성을 전통 성명학과 별도 평가한다.

## 변경 작업
- 파생 데이터는 가능한 경우 직접 편집하지 말고 `data/meta/build-manifest.json`의 generator로 재생성한다.
- 구조화 데이터·규칙·workflow 변경 후 `npm run check`를 통과시킨다.
- `data/meta/quality-gates.json`에서 blocking 상태인 계층을 확정 사실로 승격하지 않는다.
- 현행 공식 인명용 한자 전수 diff 완료 전까지 secondary mirror를 현행 법적 전체목록으로 표현하지 않는다.
- 수치가 변하면 `data/meta/dataset-stats.json`을 갱신하고 README의 숫자를 독립적으로 관리하지 않는다.
