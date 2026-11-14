# 성씨 상세 엔트리 스키마

`entries/<한자>.json`은 앱이나 AI가 한 성씨를 바로 조회할 때 사용하는 상세 레코드다.

## 공통 필수 영역
- `surname_id`
- `identity`: 한글·한자·Unicode·대표 독음
- `character_metadata`: 사전형 훈·부수·기술 총획
- `census_2015`: 2015-11-01 인구·순위
- `pronunciation`: 음절 초성·중성·종성·CV/CVC
- `romanization`: 국어의 로마자 표기법 기준형
- `stroke_policy`: 기술 총획과 성명학 획수의 분리
- `naming_policy`: 성씨를 이름자와 다르게 처리하는 규칙
- `verification`: 자료별 검증 상태

## 선택 영역
- `representative_clans_2015`: 공식 자료에서 대표 본관이 확인된 경우만 수록
- `common_usage_examples`: 비공식 영문 사용례가 필요한 경우 참고용으로만 수록
- 본관 역사·항렬·문중 전승은 별도 출처가 있을 때만 추가

## 중요
1. `technical_total_strokes`는 수리성명학의 기본 획수가 아니다.
2. `representative_clans_2015`는 전체 본관 목록이 아니다.
3. 한글 성씨가 같아도 한자가 다르면 다른 `surname_id`를 사용한다.
4. 성씨의 사전적 뜻은 이름자 의미 점수에 자동 합산하지 않는다.
5. 실제 여권 로마자 표기는 기존 사용 이력과 외교부 규정을 우선한다.

徐는 가장 상세한 기준 엔트리이며, 다른 상위 성씨는 동일한 코어 스키마에서 시작해 검증된 계보·항렬 자료가 확보될 때 확장한다.
