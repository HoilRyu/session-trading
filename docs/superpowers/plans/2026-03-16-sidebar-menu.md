# Sidebar Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 사이드바에 분류 제목과 메뉴 아이템을 갖춘 세련된 소프트 필 스타일 메뉴를 추가한다.

**Architecture:** `HomePage`의 데스크톱 사이드바 영역에 메뉴 전용 표현 컴포넌트를 추가하고, 서버 상태 카드는 하단에 유지한다. 테스트는 현재 홈 화면 렌더링 흐름을 유지하면서 분류 제목, 메뉴 아이템, 활성 상태가 노출되는지 검증한다.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library

---

## Chunk 1: Desktop Sidebar Menu

### Task 1: 메뉴 테스트 고정

**Files:**
- Modify: `frontend/src/app/App.test.tsx`
- Test: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByText('대시보드')).toBeInTheDocument()
expect(screen.getByText('투자')).toBeInTheDocument()
expect(screen.getByText('기타')).toBeInTheDocument()
expect(screen.getByRole('button', { name: '투자 현황' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '시세 / 차트' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '설정' })).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: 분류 제목 또는 메뉴 버튼을 찾지 못해 FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
<nav aria-label="데스크톱 사이드바 메뉴">
  <p>대시보드</p>
  <button type="button">대시보드</button>
</nav>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/App.test.tsx frontend/src/pages/HomePage.tsx
git commit -m "feat: add desktop sidebar menu"
```

### Task 2: 소프트 필 메뉴 구현

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Optional create: `frontend/src/features/navigation/DesktopSidebarMenu.tsx`
- Test: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Keep the file boundary small**

`HomePage.tsx`에 직접 넣을지, 메뉴 마크업이 길어지면 `DesktopSidebarMenu.tsx`로 분리할지 결정한다.

- [ ] **Step 2: Implement grouped menu UI**

분류 제목은 작은 회색 톤, 메뉴 아이템은 pill 스타일 버튼, 현재 항목은 `대시보드` 활성 상태로 표현한다.

- [ ] **Step 3: Preserve layout hierarchy**

사이드바 상단은 메뉴, 하단은 기존 서버 상태 카드로 유지한다.

- [ ] **Step 4: Run targeted verification**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: PASS

- [ ] **Step 5: Run full verification**

Run:

```bash
pnpm test:run
pnpm build
```

Expected: 전체 테스트와 빌드 PASS
