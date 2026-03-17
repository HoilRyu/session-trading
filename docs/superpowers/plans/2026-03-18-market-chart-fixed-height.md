# 시세 차트 데스크톱 고정 높이 레이아웃 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 `시세 / 차트` 화면에서 마켓 목록이 길어져도 전체 레이아웃과 차트 높이는 고정되고, 마켓 목록 본문 안에서만 스크롤되게 만든다.

**Architecture:** `MarketChartDesktopLayout`가 viewport 기준 높이 제약을 갖고, 상단 영역을 제외한 남은 높이를 콘텐츠 그리드가 차지하도록 바꾼다. `MarketChartMarketListPanel`은 부모 높이를 채우는 패널이 되고, 탭과 헤더는 고정한 채 본문 스크롤 영역만 `overflow-y-auto`를 유지한다.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Tailwind CSS

---

## Chunk 1: 고정 높이 레이아웃 규칙을 테스트로 고정

### Task 1: 데스크톱 레이아웃 테스트 보강

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`

- [ ] **Step 1: 고정 높이 기대 동작을 테스트에 추가**

`MarketChartDesktopLayout.test.tsx`에 아래 기대를 추가한다.

- 최상위 컨테이너가 `h-[calc(100vh-3rem)]`
- 콘텐츠 그리드가 `min-h-0`
- 왼쪽 메인 컬럼이 `min-h-0`

`MarketChartMarketListPanel.test.tsx`에 아래 기대를 추가한다.

- 패널 최상위가 `h-full min-h-0`
- 본문 스크롤 영역이 `min-h-0 overflow-y-auto`

- [ ] **Step 2: 테스트를 단독 실행해 실패를 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
```

Expected:

- 새 높이/스크롤 클래스 기대값 때문에 실패

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
git commit -m "test(front): 시세 차트 고정 높이 레이아웃 기대값 추가"
```

## Chunk 2: 데스크톱 레이아웃 높이 제약 구현

### Task 2: 데스크톱 콘텐츠 그리드와 차트 컬럼 높이 고정

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- Test: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`

- [ ] **Step 1: 데스크톱 최상위 컨테이너를 고정 높이 구조로 변경**

아래 방향으로 최소 수정한다.

- 최상위 컨테이너: `min-h` 대신 `h-[calc(100vh-3rem)] min-h-0`
- 콘텐츠 그리드: `flex-1 min-h-0`
- 왼쪽 메인 컬럼: `min-h-0`
- 차트 래퍼: `min-h-0 flex-1`

- [ ] **Step 2: 레이아웃 테스트를 다시 실행해 통과 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx
```

Expected:

- PASS

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx
git commit -m "fix(front): 시세 차트 데스크톱 높이 고정"
```

## Chunk 3: 마켓 목록 패널 내부 스크롤 고정

### Task 3: 마켓 목록 패널이 부모 높이 안에서만 스크롤되도록 조정

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
- Test: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`

- [ ] **Step 1: 패널 최상위와 본문 스크롤 영역에 높이 제약 적용**

아래 방향으로 최소 수정한다.

- 최상위 패널: `h-full min-h-0`
- 본문 스크롤 영역: `min-h-0 flex-1 overflow-y-auto`

상단 탭과 컬럼 헤더는 기존처럼 스크롤되지 않는 영역으로 둔다.

- [ ] **Step 2: 패널 테스트를 다시 실행해 통과 확인**

Run:

```bash
pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
```

Expected:

- PASS

- [ ] **Step 3: 전체 검증 실행**

Run:

```bash
pnpm test:run
pnpm build
```

Expected:

- 전체 테스트 통과
- 빌드 통과

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
git commit -m "fix(front): 시세 차트 마켓 목록 내부 스크롤 고정"
```
