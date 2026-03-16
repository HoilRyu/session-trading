# Sidebar Route Navigation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 사이드바 메뉴를 URL 기반 라우팅과 연결해 메뉴 클릭 시 오른쪽 상단/콘텐츠 영역이 메뉴별 파일로 교체되도록 만든다.

**Architecture:** `HomePage`는 데스크톱/모바일 공통 레이아웃 역할만 맡고, 데스크톱 오른쪽 영역은 중첩 라우트의 `Outlet`으로 렌더링한다. 메뉴별 화면은 개별 파일로 분리하고, 사이드바 메뉴는 `NavLink`로 활성 상태와 경로 이동을 함께 처리한다.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library

---

## Chunk 1: Sidebar Route Navigation

### Task 1: 경로 기반 동작 테스트 고정

**Files:**
- Modify: `frontend/src/app/App.test.tsx`
- Test: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(within(desktopSidebarMenu).getByRole('link', { name: '대시보드' })).toHaveAttribute(
  'aria-current',
  'page',
)
expect(screen.getByText('상단 영역 - 대시보드')).toBeInTheDocument()
fireEvent.click(within(desktopSidebarMenu).getByRole('link', { name: '투자 현황' }))
expect(await screen.findByText('상단 영역 - 투자 현황')).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: 링크 역할 또는 메뉴별 콘텐츠 문구를 찾지 못해 FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
<NavLink to="/dashboard">대시보드</NavLink>
<Outlet />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/App.test.tsx frontend/src/app/router.tsx frontend/src/pages
git commit -m "feat: 사이드바 라우트 전환 추가"
```

### Task 2: 메뉴별 파일 분리와 레이아웃 연결

**Files:**
- Modify: `frontend/src/app/router.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/features/navigation/DesktopSidebarMenu.tsx`
- Create: `frontend/src/features/navigation/DesktopRouteContent.tsx`
- Create: `frontend/src/pages/DashboardPage.tsx`
- Create: `frontend/src/pages/InvestmentStatusPage.tsx`
- Create: `frontend/src/pages/MarketChartPage.tsx`
- Create: `frontend/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Extract the desktop content shell**

공통 상단/콘텐츠 영역 표현을 `DesktopRouteContent`로 추출한다.

- [ ] **Step 2: Create route page files**

각 메뉴 파일은 해당 메뉴명으로 `상단 영역 - 메뉴명`, `콘텐츠 영역 - 메뉴명`을 렌더링한다.

- [ ] **Step 3: Convert the sidebar menu to NavLink**

링크 클릭 시 URL이 바뀌고 활성 메뉴가 자동 반영되도록 한다.

- [ ] **Step 4: Wire nested routes**

`/dashboard`, `/investment-status`, `/market-chart`, `/settings`를 만들고 `/`는 기본적으로 `dashboard`로 보이게 연결한다.

- [ ] **Step 5: Run full verification**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: 전체 테스트와 빌드 PASS
