# 대법원 인명용 한자 - 보조 데이터 미러

## 데이터
- 원본 미러: rutopio/Korean-Name-Hanja-Charset/data-gov.csv
- 원 미러의 수집 출처: 대한민국 법원 전자가족관계등록시스템 인명용 한자 조회
- 원 미러의 대법원 데이터 수집일: **2024-07-16**
- 이 저장소 반영일: **2026-11-14**
- 라이선스: 원 미러 저장소의 MIT License 사본을 함께 보관

## 현재 변환 결과
- 원본 CSV 데이터 행: **10,163**
- 복수 독음을 개별 관계로 펼친 행: **11,803**
- 고유 Unicode 코드포인트: **9,460**
- 개별 한글 독음: **486**

## 중요한 해석
2024년 대법원 발표의 인명용 한자 수 **9,389자**와 이 보조 데이터의 고유 코드포인트 수가 일치하지 않는다. 이 파일은 대법원 조회 화면을 크롤링한 제3자 미러이며 자형·허용자체·복수 독음 등 표현 방식이 포함될 수 있으므로, 위 숫자 차이를 곧바로 법적 한자 개수의 변화로 해석하면 안 된다.

따라서 이 데이터는 **빠른 후보 검색용 인덱스**로 사용하고, 실제 출생신고 가능 여부를 판정할 때에는 현재 시행 중인 「가족관계의 등록 등에 관한 규칙」 제37조·별표 1·별표 2 및 대법원 전자가족관계등록시스템 조회를 최종 기준으로 삼는다.

## 생성 파일
- data/hanja/raw/rutopio-data-gov-2024-07-16.csv: 제3자 미러 원본
- data/hanja/normalized/by-reading.csv: 독음별 검색에 적합하게 펼친 관계
- data/hanja/normalized/characters.csv: Unicode 코드포인트별 독음 목록
- data/hanja/normalized/reading-index.json: AI/프로그램이 독음으로 바로 찾는 인덱스

## 공식 확인 링크
- 대법원 인명용 한자 조회: https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010
- 대법원 인명용 한자표 PDF: https://help.scourt.go.kr/nm/images/hanja/hanja.pdf
- 현행 「가족관계의 등록 등에 관한 규칙」: https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=272659
