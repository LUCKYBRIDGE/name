# AI Studio 앱 스냅샷

## 목적

`ai-studio/`는 Google AI Studio에서 만든 작명·사주 앱이
`LUCKYBRIDGE/name` 데이터와 규칙을 어떤 구조로 사용하고 있는지 보존하기 위한
**시점 스냅샷**이다.

- AI Studio 앱: https://ai.studio/apps/23ccdd98-87ab-46ff-a866-7534f81997b3
- 원본 ZIP: `2026-11-14-3-37-47.zip`
- 반영일: 2026-11-14
- 원본 ZIP 내 파일 수: 172개
- 저장 위치: `ai-studio/`

업로드 과정에서는 원 ZIP의 172개 파일 각각에 대해 SHA-256을 계산하고,
GitHub Actions에서 재구성한 `ai-studio/` 파일과 전부 대조했다.
최종 커밋은 모든 파일의 해시가 일치한 경우에만 수행되었다.

## 중요한 데이터 기준

`ai-studio/data/luckybridge/`는 앱 내보내기 시점에 포함되어 있던
`name` 저장소 자료의 복사본이다. **현재 데이터의 단일 기준(source of truth)이 아니다.**

현재 기준은 계속 다음 루트 경로다.

- `data/`
- `knowledge/`
- `workflows/`
- `tests/`
- `sources/`
- `docs/`

따라서 이후 한자·성씨·본관·명리·시간·출처·저작권 데이터를 개선할 때는
`ai-studio/data/luckybridge/`를 먼저 수정하지 않는다.
루트 기준 데이터를 수정·검증한 뒤 앱을 갱신하고, 필요하면 AI Studio에서 새 ZIP을
내보내 `ai-studio/` 스냅샷 전체를 새 버전으로 교체한다.

## 주요 앱 구조

- `src/App.tsx`: 앱 최상위 화면과 흐름
- `src/components/NamingStudioPanel.tsx`: 작명 작업 영역
- `src/components/SajuSurnamePanel.tsx`: 사주·성씨 분석 영역
- `src/components/ComparisonReportPanel.tsx`: 후보 비교/리포트
- `src/components/HanjaDictionaryPanel.tsx`: 한자 조회
- `src/components/RepoSyncPanel.tsx`: 저장소 데이터 연동 UI
- `server/dataLoader.ts`: LUCKYBRIDGE 데이터 로딩
- `server/sajuEngine.ts`: 사주 계산 로직
- `server/namingEngine.ts`: 작명 분석 로직
- `src/types/naming.ts`: 앱 도메인 타입
- `.aistudio/artifacts/brain/.../implementation_plan.md`: AI Studio 구현 과정/계획 기록
- `data/luckybridge/`: 내보내기 당시 앱에 포함된 데이터 스냅샷

## 실행 정보

내보내기 당시 `package.json` 기준 주요 구성은 React 19, Vite 8, Express,
Google Gen AI SDK, lunar-typescript, hanzi-writer 등이다.

로컬 실행 절차는 `ai-studio/README.md`를 따른다.

## 비밀정보

업로드 전 ZIP 전체를 검사했으며 실제 Gemini API 키, GitHub 토큰,
OpenAI 키, 개인키 형식의 비밀정보는 발견되지 않았다.

`ai-studio/.env.example`에는 예시값만 존재한다.
실제 `GEMINI_API_KEY`는 AI Studio의 Secrets 기능 또는 배포 환경의 비밀변수로
관리하고 GitHub에 커밋하지 않는다.

## 저작권·출처

이 스냅샷에는 루트 데이터의 복사본이 포함되어 있으므로 저장소 루트의 현재 정책을
함께 적용한다.

- `COPYRIGHT.md`
- `COPYRIGHT_AND_DATA_USE.md`
- `THIRD_PARTY_NOTICES.md`
- `APP_ATTRIBUTION.md`
- `data/meta/source-rights.csv`
- `data/meta/distribution-policy.csv`

특히 `ai-studio/data/luckybridge/meta/` 안의 권리 메타데이터는
**2026-11-14 앱 내보내기 당시 스냅샷**이므로, 현재 재배포 가능 여부나
출처표시 의무를 판단할 때는 반드시 저장소 루트의 최신 메타데이터를 우선한다.

## 업데이트 원칙

1. 루트 DB와 규칙을 먼저 개선한다.
2. 루트의 `npm run check`와 저작권/출처 검증을 통과시킨다.
3. AI Studio 앱에 변경사항을 반영한다.
4. 중요한 앱 버전에서는 새 ZIP을 내보낸다.
5. 기존 `ai-studio/`를 부분 덮어쓰기하기보다 새 내보내기본으로 전체 교체한다.
6. 교체 시 내보내기 날짜와 앱 링크를 이 문서에 갱신한다.

이렇게 하면 **데이터베이스의 최신 상태**와 **실제 앱이 어느 시점에 어떤 자료로
구성되었는지**를 서로 섞지 않고 추적할 수 있다.
