# 성명학·작명 방법론 DB

이 폴더는 발음오행·자원오행·81수리·획수·용신 적용처럼 **학파나 저자에 따라 달라지는 계산법**을 한 규칙으로 섞지 않기 위한 method 레이어다.

## 핵심 원칙

- `method_id` 없는 성명학 계산은 확정 결과로 사용하지 않는다.
- Unicode 기술 총획과 성명학 원획은 별개다.
- 발음오행은 초성 중심 통용형과 초·중·종성 반영 제안형을 구분한다.
- 자원오행은 한자의 절대 속성으로 저장하지 않고 배속표의 출처와 method를 함께 기록한다.
- 81수리는 획수 기준·원형이정 계산·1~81 해석표를 한 묶음으로 등록한다.
- 용신을 이름에 적용할 때는 사주 용신 method와 성명학 method를 모두 기록한다.
- 학술 논문은 해당 방법론의 존재·구조·비판점을 확인하는 참고 근거이며 전통 이론의 과학적 미래예측 효력을 입증하는 자료로 취급하지 않는다.

## 현재 상태

`naming-method-registry.csv`는 **방법론 카탈로그**다. 계산표가 검증되지 않은 method는 `table_pending` 또는 `method_definition_pending` 상태로 유지하며 앱에서 확정 점수에 사용하지 않는다.

현재 추가된 구조:
- `pronunciation-onset-common.csv`: 출처 연결 초성 발음오행 통용형
- `kangxi-radical-stroke-ranges.csv`: Unihan `kRSKangXi`용 강희 214부수 정규 획수 구간
- `stroke-kangxi-rs-reconstruction.policy.json`: 부수 정규획 + residual strokes 기술 재구성 규칙
- `resource-element-radical-legacy-knolname2.csv`: 기존 앱 214부수 자원오행 하드코딩의 비권위 legacy 이전본
- `resource-element-overrides-legacy-knolname2.csv`: 기존 앱 84자 자의 override의 비권위 legacy 이전본
- `wonhoek-adjustments-legacy-knolname2.csv`: 기존 앱 11종 원획 delta 보정의 비권위 legacy 이전본
- `numerology-81-method-provenance.csv`: legacy·구마사키·채침/홍범 계열의 출처와 검증상태 분리

다음 우선순위:
- 출처가 확인된 자원오행 학파별 한자 배속표
- 구마사키 1차 원전의 1~81행 페이지 단위 전사 및 독립 대조
- 원획수의 학파별 숫자한자·이체자·예외표
- 서로 다른 method 결과를 병렬 비교하는 테스트 벡터
