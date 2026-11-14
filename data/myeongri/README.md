# 명리 계산 데이터

이 폴더는 AI가 명리학 용어를 '그럴듯하게 생성'하지 않고, 고정 규칙은 표에서 조회하고 해석은 방법론별로 분리하도록 만든 데이터셋이다.

## 고정/재현 가능한 표
- 천간.csv
- 지지.csv
- 육십갑자.csv
- 지장간.csv
- 십성_천간100.csv
- 천간합.csv
- 지지충.csv / 지지육합.csv / 지지삼합.csv / 지지방합.csv
- 지지형.csv / 지지파.csv / 지지해.csv
- 월지_절기경계.csv
- 오호둔_월간.csv
- 오서둔_시간.csv
- 십이운성_화토동궁.csv

## 해석 방법론
- 용신_방법론_카탈로그.csv

용신·격국·신강신약 등은 단일 계산표로 확정하지 않는다. 2026년 AI 명리 해석 비교 연구에서도 십성 오판, 지장간 순서 오류, 월지 인식, 용신·희신·기신 혼선, 합충 적용 불명확성이 확인되었다. 따라서 먼저 이 폴더의 고정 데이터를 검증하고 이후 method_id별 해석을 수행한다.

## 출처
- 지장간 구성 연구: https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART002596264
- 십성 개념 연구: https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002810441
- 지지 합충 연구: https://kci.go.kr/kciportal/landing/article.kci?arti_id=ART002788509
- 충·형 근원 연구: https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART001802048
- 십이운성 연구: https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART002722234
- 생성형 AI 명리 해석 한계 연구: https://www.kci.go.kr/kciportal/mobile/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003361304
- 구현 교차검증: 6tail/lunar-python (MIT) https://github.com/6tail/lunar-python/blob/1645ad3b3653635e5cb31b0c6df22b5e4298f8ce/lunar_python/util/LunarUtil.py

## 주의
학술논문은 전통 명리학 이론을 연구한 자료이며 그 이론의 과학적 미래예측 효력을 입증하는 자료로 취급하지 않는다.
