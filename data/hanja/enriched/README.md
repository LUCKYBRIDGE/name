# 인명용 한자 보강 데이터

이 폴더는 정규화된 인명용 한자 후보에 **훈음·부수·기술 총획**을 결합한다.

## 원천
1. 법적 후보/독음: 2024-07-16 대법원 조회 기반 제3자 미러
2. 훈음: libhangul `data/hanja/hanja.txt`
3. 부수·총획: Unicode Unihan 파생 데이터

출처 식별자는 `data/meta/sources.csv`를 따른다.

## 현재 통합 마스터 기준
- 고유 한자 코드포인트: 9,460
- 정확 훈음을 하나 이상 확보한 한자: 7,150
- 정확 훈음 관계: 7,425
- Unicode 부수/기술 총획 결합 한자: 8,786

전체 데이터 수치의 기준은 `data/meta/dataset-stats.json`이다.

## 파일
- `legal-reading-meaning.csv`: 독음-한자 기준 훈음 결합 원출력
- `hanja-meaning-summary.csv`: 한자별 훈음 요약
- `unihan-radical-strokes-provisional.csv`: Unicode 기술 메타데이터
- `hanja-master-enriched.csv`: AI·앱 기본 조회용 통합 마스터
- `MASTER_README.md`: 마스터 사용 규칙
- `STROKE_STATUS.md`: 획수 데이터 출처·한계
- `../semantics/meaning-senses.csv`: 7,425개 독음-한자 관계를 13,046개 의미 항목으로 분해한 전수 레이어
- `../semantics/naming-meaning-curated.csv`: 작명 대표 의미 선택을 위한 검토 레이어

## 중요
- 통합 마스터와 정규화 인덱스를 기본 조회원으로 사용한다.
- 원출력 파일의 행 수를 정규화 독음 관계 수로 간주하지 않는다.
- `meaning_ko`는 여러 훈이 한 셀에 들어갈 수 있는 사전형 훈음이며 작명상의 길상 의미와 다르다.
- 여러 뜻을 사용할 때는 `data/hanja/semantics/meaning-senses.csv`에서 독음별 전체 의미를 확인한다.
- 훈음 미일치는 '뜻 없는 글자'를 뜻하지 않는다.
- Unicode 총획은 특정 성명학 획수로 자동 사용하지 않는다.
- 최종 법적 허용 여부는 최신 공식 법원 자료로 다시 확인한다.
