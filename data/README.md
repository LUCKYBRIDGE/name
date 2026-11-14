# 구조화 데이터 운영 규칙

이 폴더는 작명 앱과 AI가 직접 조회할 **구조화 데이터**를 저장합니다.

## 주요 영역
- `hanja/`: 인명용 한자 후보·독음·훈음·Unicode 기술 메타데이터
- `surnames/`: 성씨 한자·본관·기준시점 통계. 현재 徐 기준 레코드부터 구축
- `myeongri/`: 천간·지지·십성·합충형파해 등 명리 계산 기본표
- `rules/`: 공통 규칙표
- `time/`: 절기·대한민국 시간대/DST 자료
- `meta/`: 출처 등록부·데이터 통계·스키마 버전

`surnames/`는 徐를 시작으로 단계적으로 확장하며 향후 `seongmyeong/`, `names/`, `romanization/`을 보강합니다.

## 신뢰 계층
1. **official** — 법령·법원·KASI 등 공식 원천
2. **technical** — Unicode·IANA 등 기술 표준
3. **academic** — 학술 연구
4. **secondary** — 제3자 미러·구현 참고
5. **provisional** — 버전·원천 확인이 추가로 필요한 임시 기술 데이터

## 필수 규칙
- 새 데이터에는 가능한 한 `source_id`를 부여하고 `meta/sources.csv`에 등록합니다.
- 학파별 값은 `method_id` 없이 절대 속성처럼 저장하지 않습니다.
- 미확인 값은 추측하지 않고 빈 값/null로 유지합니다.
- raw → normalized → enriched → master의 계층을 구분합니다.
- 데이터 수치의 단일 기준은 `meta/dataset-stats.json`입니다.
- 현행 법적 판정이 필요한 인명용 한자는 후보 검색 데이터만으로 확정하지 않습니다.

## 검증
`scripts/validate/validate-data.mjs`는 한자 중복, 인덱스 일치, 기본 명리 표의 행 수 등을 검사합니다.
