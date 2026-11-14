# Unicode 부수·획수 기술 데이터 상태

## 반영 결과
- 대법원 미러 고유 코드포인트: 9,460
- Unicode-derived 기술 부수/총획 데이터가 결합된 글자: 8,786
- 미결합 글자: 674
- 커버리지: 92.9%

## 출처
이번 결합은 `Baotrh8805/pbl6/ai-service/app/extract/data/unihan_rs.csv`를 **Unicode Unihan의 파생 미러**로 사용한다. 해당 프로젝트 문서는 이 CSV가 `Unihan_IRGSources.txt`의 `kRSUnicode`, `kTotalStrokes`에서 생성되며 Unicode License 적용 대상이라고 명시한다.

중요한 제한: 그 빌드 스크립트는 `https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip`을 사용하며, 생성 CSV 자체에 Unicode 버전이 고정되어 있지 않다. 따라서 이 파일은 현재 **provisional technical metadata**로 취급한다.

## 성명학 획수와 분리
`kTotalStrokes`는 Unicode의 기술적 총획수 필드다. 이것을 특정 한국 성명학 학파의 원획/필획 규칙으로 자동 치환하지 않는다.

향후 작업:
1. Unicode 버전이 명시된 공식 `Unihan.zip`을 고정해 재생성
2. 미결합 확장 한자·호환 한자 원인 분류
3. 성명학 원획은 별도 `method_id`와 출처를 가진 파생 데이터로 생성
