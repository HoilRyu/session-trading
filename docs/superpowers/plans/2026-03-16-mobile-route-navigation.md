# Mobile Route Navigation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 하단 탭과 더보기 패널의 설정 항목을 라우팅과 연결해 메뉴 클릭 시 현재 페이지가 바뀌는 것을 확인할 수 있게 만든다.

**Architecture:** 기존 데스크톱 라우팅을 재사용하고, 모바일은 현재 라우트의 메뉴명을 읽어 상단 앱바와 콘텐츠 영역 라벨을 갱신한다. 하단 탭은 직접 라우트 링크로 연결하고, 더보기 패널은 서버 상태 카드와 설정 이동 링크를 함께 가진다.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library

---

## Chunk 1: Mobile Route Navigation

### Task 1: 모바일 라우팅 테스트 고정

**Files:**
- Modify: `frontend/src/app/App.test.tsx`
- Test: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
fireEvent.click(screen.getByRole('link', { name: '투자 현황' }))
expect(await screen.findByText('상단 앱바 영역 - 투자 현황')).toBeInTheDocument()
fireEvent.click(screen.getByRole('button', { name: '더보기 열기' }))
fireEvent.click(screen.getByRole('link', { name: '설정' }))
expect(await screen.findByText('상단 앱바 영역 - 설정')).toBeInTheDocument()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: 모바일 링크 또는 설정 이동 검증에서 FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
<NavLink to="/investment-status">투자 현황</NavLink>
<NavLink to="/settings">설정</NavLink>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:run src/app/App.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/App.test.tsx frontend/src/pages/HomePage.tsx frontend/src/features/navigation
git commit -m "feat: 모바일 메뉴 라우팅 추가"
```
