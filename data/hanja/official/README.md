# 현행 공식 인명용 한자 전수 대조 입력

이 폴더는 대법원 현행 인명용 한자표/조회 결과를 정규화한 공식 대조 입력을 두는 자리다.
현재 후보 검색 원본은 2024-07-16 제3자 미러이며, 현행 공식 표와의 전체 차집합 검증은 아직 완료되지 않았다.

## 입력
`official-reading-character.template.csv` 형식을 사용한다.
필수: `reading`, `hanja`, `unicode`
권장: `legal_category`, `variant_of`, `source_id`, `verified_at`

## 대조
```bash
node scripts/audit/compare-official-hanja.mjs data/hanja/official/official-reading-character.csv data/hanja/audit/official-diff.json
```

비교 기준은 (독음 + Unicode 코드포인트)이다. 대법원이 2024년 발표한 총 9,389자와 저장소의 9,460 코드포인트는 집계 단위가 다를 수 있으므로 숫자만으로 오류를 단정하지 않는다. 허용자체·동자·속자·약자와 복수 독음을 행 단위로 대조한다.

공식 원본의 재배포 범위를 확인하기 전에는 PDF 원문 복제보다 검증 가능한 정규화 결과와 출처 메타데이터를 우선 저장한다.
