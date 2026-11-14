# 구조화 데이터 운영 규칙

이 폴더는 작명 앱과 AI가 직접 조회할 구조화 데이터를 저장한다.

## 주요 영역
- `hanja/`: 인명용 한자 후보·독음·다중 의미·Unicode 기술 메타데이터
- `surnames/`: 2015 총조사 순위 1~31위 31개 성씨 코어, 본관 요약·계통 연구
- `myeongri/`: 천간·지지·십성·합충형파해 등 명리 계산 기본표
- `rules/`: 공통 규칙표
- `time/`: 절기·대한민국 시간대/DST 자료
- `meta/`: 출처 등록부·출처 감사·빌드 계보·품질 게이트·통계·스키마 버전

향후 핵심 확장 대상은 이름 통계, method별 성명학 계산 DB, 검증된 항렬 자료, 장기 사주 계산 테스트 벡터다.

## 데이터 계층
- raw: 원자료/미러 보존
- normalized: 중복 제거·키 정규화
- enriched: 외부 사전·기술 메타 결합
- semantics / methods: 의미·작명/학파별 규칙
- master / entries: 앱 조회용 통합 결과

## 재현성
`data/meta/build-manifest.json`이 파생 파일과 생성 스크립트의 관계를 기록한다.

현재 정확 재생성 가능:
- raw 한자 미러 → `by-reading.csv`, `characters.csv`
- `by-reading.csv` → `reading-index.json`
- `legal-reading-meaning.csv` → `meaning-senses.csv`
- `sources.csv` → `source-audit.csv`

전체 빌드 계보가 없는 enriched/KOSIS 파생 파일은 manifest에서 별도 표시한다.

## 신뢰 원칙
- 법적 사실·재현 가능한 계산·전통 해석을 분리
- method별 값은 `method_id` 유지
- 미확인 값은 null/빈 값
- 후보 검색용 한자 미러와 현행 법적 판정 분리
- `quality-gates.json`의 blocking 계층은 앱에서 확정 결과로 표시하지 않음

## 검증
```bash
npm run check
```
