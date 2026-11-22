# NAME 지식·데이터 탐색 인덱스

AI와 앱 개발 코드는 사용자 요청의 **의도**에 따라 필요한 데이터만 읽는다.

## 요청별 우선 경로
| 요청 | 우선 데이터/문서 | 추가 참고 |
|---|---|---|
| 이름 추천 | workflows/이름-추천.md | knowledge/17-이름-실사용성-평가.md |
| 이름 분석 | workflows/기존-이름-분석.md | docs/04-성명학-규칙.md |
| 한자 후보 검색 | data/hanja/normalized/reading-index.json | data/hanja/enriched/hanja-master-enriched.csv |
| 성씨·본관 | data/surnames/ | knowledge/19-성씨-처리원칙.md |
| 한자 뜻·훈 | data/hanja/semantics/meaning-senses.csv | knowledge/20-한자-다중의미-작명해석.md |
| 인명용 한자 법적 판정 | data/legal/name-registration-rules.csv | knowledge/05-인명용한자-법적판정.md |
| 사주·오행 | data/myeongri/ | knowledge/16-사주-분석레이어.md |
| 수리·음양·발음오행 | data/methods/naming-method-registry.csv | knowledge/12-성명학-학파별-분리원칙.md |
| 후보 비교 | workflows/후보-비교.md | templates/분석-출력-형식.md |
| 출생 전 후보 | workflows/출생전-후보와-출생후-확정.md | knowledge/14-출생일시-입력규격.md |
| 데이터 상태/개수 | data/meta/dataset-stats.json | data/meta/schema-version.json |
| 외부 출처 | data/meta/sources.csv | sources/명리학-작명-자료맵.md |
| AI Studio 앱 구조 | ai-studio/ | docs/06-AI-Studio-앱-스냅샷.md |

## 한자 데이터
- 독음 관계: `data/hanja/normalized/by-reading.csv`
- 한자별 독음: `data/hanja/normalized/characters.csv`
- 빠른 조회: `data/hanja/normalized/reading-index.json`
- 통합 검색 마스터: `data/hanja/enriched/hanja-master-enriched.csv`
- 다중 의미 전수 레이어: `data/hanja/semantics/meaning-senses.csv`
- 작명 의미 검토 레이어: `data/hanja/semantics/naming-meaning-curated.csv`
- 선택 의미 표준 객체: `data/hanja/semantics/name-meaning-selection.schema.json`
- 의미 주의 규칙: `data/hanja/semantics/semantic-risk-rules.csv`
- 주의 의미 검토표: `data/hanja/semantics/sense-concern-curated.csv`
- 원자료 의미 품질 보류: `data/hanja/semantics/semantic-source-issues.csv`
- 다중 의미 원칙: `knowledge/20-한자-다중의미-작명해석.md`
- 마스터 설명: `data/hanja/enriched/MASTER_README.md`
- 공식/보조 데이터 상태: `data/hanja/SOURCE_STATUS.md`, `SECONDARY_MIRROR.md`

## 성씨 데이터
- 31개 성씨 마스터: `data/surnames/surnames.csv`
- 이번 확장 30개: `data/surnames/top30-excluding-xu-2015.csv`
- 성씨별 상세: `data/surnames/entries/<한자>.json`
- 상세 스키마: `data/surnames/entries/README.md`
- 31개 발음 프로필: `data/surnames/pronunciation-profiles.csv`
- 획수 안전 정책: `data/surnames/stroke-policies.csv`
- 동음·두음법칙 구분: `data/surnames/hangul-hanja-disambiguation.csv`
- 표준 본관 요약(31개·223행): `data/surnames/clans-core-2015.csv`
- 대표 본관 통계: `data/surnames/representative-clans-2015.csv`
- 徐 전체 본관 통계: `data/surnames/clans-2015.csv`
- 31개 성씨 본관·계통 연구: `data/surnames/clan-history.csv`
- 심층 연구 진행상태: `data/surnames/research-status.csv`
- 徐 수준 연구 기준: `data/surnames/RESEARCH_GUIDE.md`
- 처리 원칙: `knowledge/19-성씨-처리원칙.md`

## 성명학 방법론 데이터
- method 카탈로그: `data/methods/naming-method-registry.csv`
- 평가축 분리 정책: `data/methods/evaluation-axis-policy.json`
- 원칙 설명: `data/methods/README.md`

## 법적 이름 등록 데이터
- 현행 규칙 요약: `data/legal/name-registration-rules.csv`
- 처리 원칙: `data/legal/README.md`

## 명리 계산 데이터
- 천간·지지·육십갑자: `data/myeongri/천간.csv`, `지지.csv`, `육십갑자.csv`
- 지장간: `data/myeongri/지장간.csv`
- 십성 100관계: `data/myeongri/십성_천간100.csv`
- 합·충·형·파·해: `data/myeongri/천간합.csv`, `지지*.csv`
- 월지 절기·오호둔·오서둔: `월지_절기경계.csv`, `오호둔_월간.csv`, `오서둔_시간.csv`
- 십이운성: `data/myeongri/십이운성_화토동궁.csv`
- 용신 방법론: `data/myeongri/용신_방법론_카탈로그.csv`

## 출생일시·시간
- 입력 규격: `knowledge/14-출생일시-입력규격.md`
- 시주·시간보정: `knowledge/15-시주-시간보정-방법론.md`
- 2026/2027 절기: `data/time/*_24절기_KASI.csv`
- 한국 표준시 이력: `data/time/대한민국_표준시_역사.csv`
- 한국 DST: `data/time/대한민국_DST_rules.csv`

## 검증
- 대표 데이터 사례: `tests/명리-한자-데이터-대표검증.csv`
- 徐 성씨 작명 규칙: `tests/徐-성씨-작명규칙.csv`
- 상위 30개 확장 검증: `tests/상위30-성씨-대표검증.csv`
- 한자 다중 의미 검증: `tests/한자-다중의미-대표검증.csv`
- 사주 절기 경계 회귀검증: `tests/사주-절기경계-검증.csv`
- 독립 구현 교차검증: `tests/사주-팔자-교차검증-lunar-python-1.4.9.csv`
- 외부 구현 시간기준: `data/time/reference-implementation-time-basis.csv`
- AI 응답 실패 사례: `tests/AI-응답-검증-시나리오.md`
- 파생 데이터 빌드 계보: `data/meta/build-manifest.json`, `scripts/build/`
- 품질 게이트: `data/meta/quality-gates.json`
- 출처 감사: `data/meta/source-audit.csv`
- 공식 인명용 한자 전수대조 도구: `data/hanja/official/`, `scripts/audit/compare-official-hanja.mjs`
- 자동 무결성 검사: `scripts/validate/validate-data.mjs`

## 검색 키워드
- 뜻/훈/한자 → 한자 마스터
- 성씨/본관/김·이·박·최·정·서 등 → 성씨 마스터와 개별 entries
- 인명용/등록/법원 → 법적 판정
- 획수/원격/형격/이격/정격/81수리 → 성명학
- 발음오행/자원오행/음양 → method별 성명학
- 사주/만세력/절기/간지 → 명리 계산
- 추천/작명/후보 → workflow

## 근거 부족 시
확인되지 않은 값은 생성하지 않는다. 법적 사실, 기술 계산, 전통적 해석을 구분하고 최신 공식 확인이 필요한 경우 이를 명시한다.

## 저작권·출처·배포
- 자체 작성 자료 권리: `COPYRIGHT.md`
- 저장소 운영 정책: `COPYRIGHT_AND_DATA_USE.md`
- 현재 감사 현황: `RIGHTS_AUDIT.md`
- 앱 출처 표시: `APP_ATTRIBUTION.md`
- 앱 UI 구현 규격: `docs/05-앱-출처-저작권-표시규격.md`
- 출처 레지스트리: `data/meta/sources.csv`
- 출처별 감사 상태: `data/meta/source-audit.csv`
- 출처별 실제 사용·재배포 등급: `data/meta/source-rights.csv`
- 경로별 라이선스: `data/meta/license-map.csv`
- 배포 범위 정책: `data/meta/distribution-policy.csv`
- 공식 재이용 정책 확인 기록: `sources/저작권-재이용-근거-2026-11.md`

외부 자료를 새로 추가하거나 앱 공개 범위를 넓히기 전에는 위 파일을 먼저 확인한다.
