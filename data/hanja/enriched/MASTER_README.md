# 인명용 한자 통합 마스터

AI가 이름 후보를 빠르게 찾을 때 사용하는 **통합 검색용 테이블**이다.

## 포함
- 대법원 인명용 한자 조회 기반 허용 독음 후보
- libhangul의 정확 (독음, 한자) 일치 훈음
- Unicode Unihan 파생 강희부수 번호·잔여획·기술 총획수

## 통계
- 총 고유 한자 코드포인트: 9,460
- 한 개 이상의 정확 훈음이 결합된 한자: 7,150
- 정확 훈음 관계 수: 7,425
- Unicode 부수/총획 결합 한자: 8,786
- 훈음+획수 모두 결합한 한자: 7,150

## 사용 순서
1. `legal_readings`로 원하는 발음의 후보인지 확인
2. `meaning_by_reading`으로 해당 독음의 훈음을 확인
3. `unihan_total_strokes`는 기술 메타데이터로 참고
4. 성명학 획수 계산 시 별도 method_id 규칙을 사용
5. 최종 출생신고 적법성은 최신 대법원 공식 조회로 다시 확인

## 데이터 계층
- legal_data_status: 2024-07-16 대법원 조회 기반 미러
- meaning_data_status: BSD 계열 libhangul의 정확 독음-글자 매칭
- stroke_data_status: Unicode Unihan 파생 미러, 버전이 CSV 자체에 고정되지 않아 provisional
- final_legal_verification_required: 항상 YES

## 절대 금지
- 이 파일만 보고 현재 출생신고 가능 여부를 확정
- Unicode 총획수를 특정 성명학 원획수로 자동 대체
- 훈음 미일치 글자를 '뜻 없는 글자'로 판단
