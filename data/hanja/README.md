# 인명용 한자 데이터 탐색

현재 **실제 공식 한자 레코드 0건**. 자료 수집 계획과 형식만 확정된 상태.

- [원본 확보 상태](SOURCE_STATUS.md)
- [필드 규칙](../../knowledge/03-한자-데이터-스키마.md)
- [법적 허용 판정](../../knowledge/05-인명용한자-법적판정.md)
- [법원 조회 페이지](https://efamily.scourt.go.kr/cs/CsBltnWrtList.do?bltnbordId=0000010)

## 파일 구조(원본 확보 후)
- `raw/`: 공식 파일의 출처·해시·버전
- `by-reading/`: 독음별 인명용 한자 목록
- `characters/`: 개별 한자 음훈·뜻·획수·이체자
- `validation/`: 검증 결과와 불일치 목록

**AI 규칙:** 여기 없는 글자의 법적 허용 여부를 추측하지 않는다. 최신 법원 조회에서 직접 확인한다.
