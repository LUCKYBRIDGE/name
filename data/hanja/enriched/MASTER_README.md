# 인명용 한자 통합 마스터

`hanja-master-enriched.csv`는 AI와 작명 앱이 한자 후보를 조회할 때 사용하는 **통합 검색용 테이블**이다.

전체 수치의 단일 기준은 `data/meta/dataset-stats.json`이다.

## 현재 데이터
- 고유 한자 코드포인트: 9,460
- 정규화 독음-한자 관계: 10,346
- 정확 훈음을 하나 이상 확보한 한자: 7,150
- 정확 훈음 관계: 7,425
- Unicode 부수/기술 총획 결합 한자: 8,786

## 포함
- 대법원 조회 기반 허용 독음 후보
- libhangul의 정확 (독음, 한자) 일치 훈음
- Unicode Unihan 파생 강희부수 번호·잔여획·기술 총획수

## 사용 순서
1. `legal_readings`로 원하는 독음 후보 확인
2. `meaning_by_reading`으로 해당 독음의 훈음 확인
3. `unihan_total_strokes`는 기술 메타데이터로만 참고
4. 성명학 획수는 별도 `method_id` 규칙이 있을 때 적용
5. 최종 출생신고 적법성은 최신 대법원 공식 조회로 재확인

## 데이터 상태
- legal_data_status: 2024-07-16 대법원 조회 기반 secondary mirror
- meaning_data_status: libhangul 정확 독음-글자 매칭
- stroke_data_status: Unicode Unihan 파생 provisional technical metadata
- final_legal_verification_required: YES

## 금지
- 이 파일만 보고 현재 출생신고 가능 여부를 확정
- Unicode 총획수를 특정 성명학 원획수로 자동 대체
- 훈음 미일치 글자를 '뜻 없는 글자'로 판단
- 서로 다른 성명학 method 결과를 출처 없이 합산
