# 데이터 메타데이터

이 폴더는 저장소 전체의 출처·스키마·통계·재현성·품질 상태를 관리한다.

## 파일
- `sources.csv`: 외부 원천의 안정적인 source_id 등록부
- `source-audit.csv`: 라이선스 메타데이터와 재배포 검토 필요성 파생 감사표
- `dataset-stats.json`: 행 수·커버리지·검증 상태의 단일 기준
- `schema-version.json`: 데이터 구조 버전과 공통 규칙
- `build-manifest.json`: 파생 데이터의 입력→생성기→출력 계보
- `integration-manifest.json`: 연동 파일 경로, 바이트 수, SHA-256 및 데이터 스키마 버전
- `quality-gates.json`: 앱/AI가 확정값으로 사용하기 전에 확인해야 할 미완성·차단 상태

## 운영 원칙
1. README에 데이터 개수를 독립적으로 복제하지 않고 dataset-stats를 기준으로 한다.
2. 파생 데이터는 build-manifest에 exact generator가 있으면 직접 수정하지 않고 생성기를 사용한다.
3. 새 CSV/JSON은 가능한 한 source_id를 사용한다.
4. 학파·저자·계산법에 따라 달라지는 값은 method_id를 유지한다.
5. 공식·기술·학술·secondary의 권위 수준을 구분한다.
6. 후보 검색용 한자 데이터와 현행 법적 판정을 동일시하지 않는다.
7. quality gate가 blocking인 기능은 앱에서 '검증 완료'로 표시하지 않는다.
8. source-audit의 redistribution_review_status는 법률 의견이 아니라 저장소 내부 검토 상태다.

## 검증
```bash
npm run check
```
