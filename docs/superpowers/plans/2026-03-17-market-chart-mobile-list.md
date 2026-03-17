# 시세 차트 모바일 목록 레이아웃 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 `/market-chart` 진입 시 콘텐츠 영역이 공통 플레이스홀더가 아니라 `마켓 목록 영역`으로 보이도록 전용 레이아웃을 추가하기

**Architecture:** 기존 `HomePage`의 모바일 공통 레이아웃은 유지하고, `/market-chart` 경로에만 적용되는 작은 전용 모바일 목록 컴포넌트를 분리한다. `HomePage`는 현재 경로를 기준으로 모바일 콘텐츠 블록만 분기하고, 데스크톱 레이아웃과 다른 모바일 메뉴는 그대로 둔다.

**Tech Stack:** React, React Router, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## 파일 구조

- Create: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
  - 모바일 `시세 / 차트` 목록 화면의 콘텐츠 영역만 담당한다.
- Create: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
  - 모바일 목록 레이아웃 컴포넌트가 올바른 라벨과 영역 클래스를 렌더링하는지 검증한다.
- Modify: `frontend/src/pages/HomePage.tsx`
  - 모바일 콘텐츠 영역을 현재 경로에 따라 공통 블록 또는 `MarketChartMobileListLayout`으로 분기한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 모바일 `/market-chart`에서 `마켓 목록 영역`이 보이고, 다른 메뉴는 기존 콘텐츠 라벨이 유지되는지 검증한다.

## Chunk 1: 모바일 목록 전용 컴포넌트 추가

### Task 1: 모바일 목록 레이아웃 TDD

**Files:**
- Create: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
- Create: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`MarketChartMobileListLayout`가 아래 조건을 만족하는 테스트를 작성한다.

- `마켓 목록 영역` 텍스트가 보인다.
- 루트 블록이 모바일 콘텐츠 용도에 맞게 `flex-1`과 `min-h-0`을 가진다.

예시:

```tsx
import { render, screen } from '@testing-library/react'

import { MarketChartMobileListLayout } from './MarketChartMobileListLayout'

describe('MarketChartMobileListLayout', () => {
  it('모바일 마켓 목록 영역을 렌더링한다', () => {
    render(<MarketChartMobileListLayout />)

    expect(screen.getByText('마켓 목록 영역')).toBeInTheDocument()
    expect(screen.getByTestId('market-chart-mobile-list')).toHaveClass(
      'min-h-0',
      'flex-1',
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`  
Expected: 컴포넌트 파일이 없어 실패

- [ ] **Step 3: 최소 구현 작성**

`MarketChartMobileListLayout.tsx`에 확인용 단일 영역 블록을 추가한다.

구현 원칙:
- 라벨은 `마켓 목록 영역`
- 현재는 배경색과 라벨만 가진 영역 블록으로 둔다.
- 모바일 콘텐츠용으로 `min-h-0`, `flex-1`을 유지한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`  
Expected: 해당 테스트 파일 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx
git commit -m "feat(front): 시세 차트 모바일 목록 레이아웃 컴포넌트 추가"
```

## Chunk 2: HomePage 모바일 콘텐츠 분기 연결

### Task 2: `/market-chart`에서만 모바일 목록 레이아웃 사용

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 라우팅 테스트 먼저 확장**

`App.test.tsx`에 아래 검증을 추가한다.

- 모바일 `/market-chart`에서 `상단 앱바 영역 - 시세 / 차트`가 보인다.
- 모바일 `/market-chart`에서 `마켓 목록 영역`이 보인다.
- 모바일 `/market-chart`에서 `콘텐츠 영역 - 시세 / 차트`는 보이지 않는다.
- 모바일 `/dashboard` 또는 `/investment-status`는 여전히 `콘텐츠 영역 - 메뉴명`을 유지한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: `/market-chart`에서 여전히 `콘텐츠 영역 - 시세 / 차트`가 보여 실패

- [ ] **Step 3: 최소 구현 작성**

`HomePage.tsx`에서 현재 활성 메뉴 라벨 또는 현재 경로를 기준으로 모바일 콘텐츠 블록을 분기한다.

구현 원칙:
- `/market-chart`일 때만 `MarketChartMobileListLayout` 렌더링
- 나머지는 기존 `MobileAreaBlock` 유지
- 데스크톱 영역과 `더보기` 동작은 건드리지 않는다.

- [ ] **Step 4: 테스트 재실행**

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: 추가한 모바일 목록 검증 포함 통과

- [ ] **Step 5: 전체 검증**

Run: `pnpm test:run`  
Expected: 모든 테스트 통과

Run: `pnpm build`  
Expected: 빌드 성공

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/pages/HomePage.tsx frontend/src/app/App.test.tsx
git commit -m "feat(front): 시세 차트 모바일 목록 화면 연결"
```

## 완료 기준

- 모바일 `/market-chart`에서 `마켓 목록 영역`이 보인다.
- 모바일 `/market-chart`에서 `콘텐츠 영역 - 시세 / 차트`는 더 이상 보이지 않는다.
- 다른 모바일 메뉴는 기존 `콘텐츠 영역 - 메뉴명`을 유지한다.
- 데스크톱 `시세 / 차트` 레이아웃에는 영향이 없다.
- `pnpm test:run`, `pnpm build`가 통과한다.
