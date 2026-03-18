# 시세 차트 마켓 목록 무한 스크롤 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 마켓 목록 패널과 모바일 `/market-chart` 목록 화면에 `limit=50` 고정 무한 스크롤과 1초 주기 전체 범위 재조회를 추가한다.

**Architecture:** `useMarketList`를 확장해 초기 로드, 다음 페이지 로드, 1초 주기 범위 재조회를 모두 관리한다. 목록 UI는 내부 스크롤 컨테이너 하단 감지로 `loadMore`를 호출하고, 데스크톱/모바일은 같은 훅 결과를 공유해 동일한 페이지네이션 규칙을 사용한다.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Tailwind CSS

---

## 파일 구조

- Modify: `frontend/src/features/market-chart/api/marketList.types.ts`
  - `start`를 포함한 쿼리 파라미터 타입과 응답 타입 확장을 반영한다.
- Modify: `frontend/src/config/backend.ts`
  - `getMarketsUrl`이 `start`와 고정 `limit=50`을 받을 수 있게 한다.
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.ts`
  - 초기 로드, 추가 로드, 1초 재조회, `hasMore`, `loadingMore` 상태를 관리한다.
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.test.tsx`
  - 초기 로드, 다음 페이지 로드, 1초 재조회, quote 변경 초기화 테스트를 추가한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
  - 스크롤 컨테이너에서 하단 감지와 하단 로딩 표시를 추가한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`
  - 하단 감지와 하단 로딩/더 이상 없음 상태를 검증한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - 확장된 훅 결과와 패널 props를 연결한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
  - 모바일 목록 화면도 같은 무한 스크롤 패널 props를 연결한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - 데스크톱에서 확장된 패널 props 연결을 검증한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
  - 모바일에서도 실제 목록과 추가 로딩 상태를 검증한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 데스크톱/모바일 라우팅 스모크 테스트를 다중 페이지 응답과 함께 검증한다.

## Chunk 1: URL 조합과 공용 훅 테스트 확장

### Task 1: `start + limit` 기반 조회 기대값을 테스트로 고정

**Files:**
- Modify: `frontend/src/features/market-chart/api/marketList.types.ts`
- Modify: `frontend/src/config/backend.ts`
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.test.tsx`

- [ ] **Step 1: 쿼리 타입과 기대 URL을 테스트에 반영**

추가 테스트 내용:

- 초기 로드가 `start=0&limit=50`
- `loadMore` 호출 시 `start=50&limit=50`
- 1초 재조회 시 현재 `loadedCount` 기준으로 `50` 단위 요청이 여러 번 발생
- quote 변경 시 목록과 범위 상태가 초기화

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/hooks/useMarketList.test.tsx
```

Expected:

- `loadMore`, `start`, `1초 재조회` 관련 기대값 때문에 실패

- [ ] **Step 3: URL 조합과 훅 최소 구현**

구현 내용:

- `MarketListQueryParams`에 `start?: number`
- `getMarketsUrl({ exchange, quote, start, limit })`
- `useMarketList`에
  - `items`
  - `total`
  - `hasMore`
  - `loadingMore`
  - `loadMore`
  - `refreshing`
- 초기 로드는 `start=0&limit=50`
- 추가 로드는 다음 `start`를 계산해 뒤에 이어붙임
- 재조회는 `loadedCount`를 `50` 단위 청크로 나눠 다시 받아 전체 목록을 교체

- [ ] **Step 4: 테스트를 다시 실행해 통과 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/hooks/useMarketList.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/api/marketList.types.ts frontend/src/config/backend.ts frontend/src/features/market-chart/hooks/useMarketList.ts frontend/src/features/market-chart/hooks/useMarketList.test.tsx
git commit -m "feat(front): 시세 차트 무한 스크롤 조회 훅 추가"
```

## Chunk 2: 목록 패널 하단 감지와 상태 표시

### Task 2: 목록 패널이 내부 스크롤 하단에서 추가 로딩을 트리거하도록 구현

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`

- [ ] **Step 1: 스크롤 감지 failing test 작성**

추가 테스트 내용:

- 스크롤 컨테이너가 하단 근접 상태가 되면 `onLoadMore` 호출
- `loadingMore`가 `true`일 때 하단 로딩 문구 표시
- `hasMore=false`일 때 추가 로딩 호출이 발생하지 않음

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
```

Expected:

- `onLoadMore`, 하단 로딩 표시 관련 기대값 때문에 실패

- [ ] **Step 3: 패널 최소 구현**

구현 내용:

- props 추가:
  - `hasMore: boolean`
  - `loadingMore: boolean`
  - `onLoadMore: () => void`
- 내부 스크롤 컨테이너에서 하단 근접 감지
- 목록 끝 하단 영역에:
  - `loadingMore`면 로딩 문구
  - 더 이상 없음이면 별도 문구 없이 종료

- [ ] **Step 4: 테스트를 다시 실행해 통과 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
git commit -m "feat(front): 시세 차트 마켓 목록 하단 로딩 추가"
```

## Chunk 3: 데스크톱/모바일 연결과 전체 검증

### Task 3: 데스크톱/모바일 목록 화면에 무한 스크롤 연결

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 연결 기대값을 테스트에 추가**

추가 테스트 내용:

- 데스크톱이 `hasMore`, `loadingMore`, `onLoadMore`를 패널로 전달
- 모바일 `/market-chart`도 같은 무한 스크롤 구조를 사용
- 라우팅 스모크 테스트에서 첫 페이지 데이터 렌더링이 유지됨

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx
pnpm test:run -- frontend/src/app/App.test.tsx
```

Expected:

- 새 props와 상태 연결 기대값 때문에 실패

- [ ] **Step 3: 데스크톱/모바일 연결 최소 구현**

구현 내용:

- 데스크톱/모바일이 확장된 훅 결과를 받아 패널에 전달
- 기존 탭 변경과 로딩/에러 동작은 유지
- 데스크톱 `BTC/KRW` 기본 선택 규칙은 유지

- [ ] **Step 4: 전체 검증 실행**

Run:

```bash
pnpm test:run
pnpm build
```

Expected:

- 전체 테스트 통과
- 빌드 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx frontend/src/app/App.test.tsx
git commit -m "feat(front): 시세 차트 무한 스크롤 연결"
```
