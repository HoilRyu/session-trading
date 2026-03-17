# 시세 차트 데스크톱 레이아웃 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `시세 / 차트` 데스크톱 화면에서 차트 중심의 콘텐츠 분할 레이아웃을 확인할 수 있도록 전용 영역 구성을 추가하기

**Architecture:** 기존 라우팅 구조는 유지하고, `MarketChartPage`만 전용 데스크톱 콘텐츠 컴포넌트를 사용하도록 분리한다. 레이아웃 확인 단계이므로 실제 기능은 넣지 않고, `거래소 선택 + 현재가/요약 정보`, `차트`, `마켓 목록` 세 영역을 배경색과 라벨로만 표현한다. 검증은 전용 컴포넌트 테스트와 앱 라우팅 스모크 테스트로 나눠서 진행한다.

**Tech Stack:** React, React Router, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## 파일 구조

- Create: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - `시세 / 차트` 데스크톱 전용 콘텐츠 레이아웃만 담당한다.
- Create: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - 전용 레이아웃 컴포넌트의 영역 분할 규칙을 검증한다.
- Modify: `frontend/src/pages/MarketChartPage.tsx`
  - 기존 공통 `DesktopRouteContent` 대신 전용 레이아웃 컴포넌트를 렌더링한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 데스크톱에서 `시세 / 차트` 메뉴 이동 후 새 레이아웃이 노출되는지 검증한다.

## Chunk 1: 전용 데스크톱 레이아웃 컴포넌트 추가

### Task 1: 전용 레이아웃 테스트부터 고정

**Files:**
- Create: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Create: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`MarketChartDesktopLayout`가 아래 구조를 렌더링하는 테스트를 작성한다.

- `상단 영역 - 시세 / 차트`
- `거래소 선택 + 현재가/요약 정보 영역`
- `차트 영역`
- `마켓 목록 영역`

또한 레이아웃 컨테이너에 아래 배치 규칙을 고정한다.

- 메인 래퍼가 2열 데스크톱 레이아웃 클래스(`grid`, `grid-cols-[minmax(0,1fr)_minmax(18rem,28%)]` 또는 동등한 의미의 클래스)를 가진다.
- 왼쪽 메인 컬럼이 세로 2단 구조 클래스(`flex`, `flex-col`)를 가진다.

예시 테스트 골격:

```tsx
import { render, screen } from '@testing-library/react'

import { MarketChartDesktopLayout } from './MarketChartDesktopLayout'

describe('MarketChartDesktopLayout', () => {
  it('차트 중심 데스크톱 영역을 렌더링한다', () => {
    render(<MarketChartDesktopLayout />)

    expect(screen.getByText('상단 영역 - 시세 / 차트')).toBeInTheDocument()
    expect(
      screen.getByText('거래소 선택 + 현재가/요약 정보 영역'),
    ).toBeInTheDocument()
    expect(screen.getByText('차트 영역')).toBeInTheDocument()
    expect(screen.getByText('마켓 목록 영역')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`  
Expected: `Cannot find module` 또는 컴포넌트 미정의로 실패

- [ ] **Step 3: 최소 구현 작성**

`MarketChartDesktopLayout.tsx`에 전용 레이아웃 컴포넌트를 추가한다.

구현 원칙:
- 루트는 기존 `DesktopRouteContent`와 동일하게 `상단 영역 - 시세 / 차트`를 유지한다.
- 콘텐츠 영역은 2열 구조로 나눈다.
- 왼쪽은 `거래소 선택 + 현재가/요약 정보 영역` 위에 `차트 영역`이 오는 세로 2단 구조다.
- 오른쪽은 `마켓 목록 영역` 하나만 둔다.
- 현재는 확인용 라벨과 배경색만 넣고 실제 기능은 넣지 않는다.

예상 구조 예시:

```tsx
export function MarketChartDesktopLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
      <div className="flex h-20 items-center justify-center rounded-3xl bg-slate-300 text-slate-900">
        상단 영역 - 시세 / 차트
      </div>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(18rem,28%)] gap-6">
        <div className="flex min-h-[24rem] flex-col gap-6">
          <div className="flex h-28 items-center justify-center rounded-3xl bg-slate-200 text-slate-900">
            거래소 선택 + 현재가/요약 정보 영역
          </div>
          <div className="flex min-h-[20rem] flex-1 items-center justify-center rounded-3xl bg-sky-200 text-sky-900">
            차트 영역
          </div>
        </div>

        <div className="flex min-h-[24rem] items-center justify-center rounded-3xl bg-blue-100 text-blue-900">
          마켓 목록 영역
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`  
Expected: `1 file passed`

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx
git commit -m "feat(front): 시세 차트 데스크톱 레이아웃 컴포넌트 추가"
```

## Chunk 2: 페이지 연결과 라우팅 검증

### Task 2: `MarketChartPage`를 전용 레이아웃으로 교체

**Files:**
- Modify: `frontend/src/pages/MarketChartPage.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 라우팅 스모크 테스트 먼저 확장**

기존 `App.test.tsx`의 데스크톱 메뉴 이동 테스트에 아래 검증을 추가한다.

- 데스크톱 사이드바에서 `시세 / 차트` 클릭
- `상단 영역 - 시세 / 차트`가 보임
- `거래소 선택 + 현재가/요약 정보 영역`이 보임
- `차트 영역`이 보임
- `마켓 목록 영역`이 보임

예시 추가 코드:

```tsx
await user.click(
  within(desktopSidebarMenu).getByRole('link', { name: '시세 / 차트' }),
)

expect(screen.getByText('상단 영역 - 시세 / 차트')).toBeInTheDocument()
expect(
  screen.getByText('거래소 선택 + 현재가/요약 정보 영역'),
).toBeInTheDocument()
expect(screen.getByText('차트 영역')).toBeInTheDocument()
expect(screen.getByText('마켓 목록 영역')).toBeInTheDocument()
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: `거래소 선택 + 현재가/요약 정보 영역` 또는 `차트 영역`을 찾지 못해 실패

- [ ] **Step 3: 페이지 연결 최소 구현**

`MarketChartPage.tsx`를 전용 레이아웃 컴포넌트를 렌더링하도록 수정한다.

예시:

```tsx
import { MarketChartDesktopLayout } from '../features/market-chart/components/MarketChartDesktopLayout'

export function MarketChartPage() {
  return <MarketChartDesktopLayout />
}
```

- [ ] **Step 4: 테스트 재실행**

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: `App.test.tsx` 통과

- [ ] **Step 5: 전체 검증**

Run: `pnpm test:run`  
Expected: 모든 테스트 통과

Run: `pnpm build`  
Expected: `vite build` 성공

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/pages/MarketChartPage.tsx frontend/src/app/App.test.tsx
git commit -m "feat(front): 시세 차트 페이지 데스크톱 레이아웃 연결"
```

## 완료 기준

- 데스크톱 `시세 / 차트` 메뉴 클릭 시 전용 레이아웃이 보인다.
- 상단 영역 아래에 `거래소 선택 + 현재가/요약 정보 영역`, `차트 영역`, `마켓 목록 영역`이 분리되어 보인다.
- 차트가 가장 큰 시각적 영역으로 읽힌다.
- 모바일 레이아웃과 다른 메뉴 페이지에는 영향이 없다.
- `pnpm test:run`, `pnpm build`가 모두 통과한다.
