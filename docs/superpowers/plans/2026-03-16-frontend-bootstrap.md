# Frontend Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `frontend` 폴더에 `pnpm` 기반 `React + Vite + TypeScript + Tailwind CSS + React Router` 실행 환경과 최소 테스트 구성을 만든다.

**Architecture:** Vite 템플릿으로 React TypeScript 앱을 생성한 뒤, 앱 진입점은 `src/main.tsx`, 라우팅 책임은 `src/app/router.tsx`, 라우터 렌더링 책임은 `src/app/App.tsx`, 페이지 책임은 `src/pages/`로 분리한다. 스타일은 Tailwind CSS를 `src/styles/globals.css`에서만 진입시키고, 테스트는 `Vitest + Testing Library + jsdom`으로 기본 라우팅 동작만 검증한다.

**Tech Stack:** pnpm, Vite, React, TypeScript, React Router, Tailwind CSS, Vitest, Testing Library

---

## 파일 구조

- 생성 또는 수정: `frontend/package.json`
- 생성 또는 수정: `frontend/pnpm-lock.yaml`
- 생성 또는 수정: `frontend/src/main.tsx`
- 생성: `frontend/src/app/App.tsx`
- 생성: `frontend/src/app/App.test.tsx`
- 생성: `frontend/src/app/router.tsx`
- 생성: `frontend/src/pages/HomePage.tsx`
- 생성: `frontend/src/pages/NotFoundPage.tsx`
- 생성: `frontend/src/styles/globals.css`
- 생성: `frontend/src/test/setup.ts`
- 생성 또는 수정: `frontend/vite.config.ts`

참고:
- `pnpm create vite frontend --template react-ts` 실행 결과로 추가 템플릿 파일이 함께 생성될 수 있다.
- 이 계획은 생성 결과 전체를 나열하지 않고, 실제로 검토하거나 수정할 핵심 파일만 고정한다.

## 참고 스펙

- [frontend bootstrap spec](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/docs/superpowers/specs/2026-03-16-frontend-bootstrap-design.md)

## Chunk 1: 프로젝트 초기화와 의존성 구성

### Task 1: Vite React TypeScript 프로젝트 생성

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/.gitignore`

- [ ] **Step 1: Vite 프로젝트 생성 명령 실행**

Run:
```bash
pnpm create vite frontend --template react-ts
```

Expected:
- `frontend/package.json`이 생성된다.
- `frontend/src/main.tsx`가 생성된다.
- Vite React TypeScript 기본 템플릿 파일이 생성된다.

- [ ] **Step 2: 생성된 기본 파일 목록 확인**

Run:
```bash
rg --files frontend
```

Expected:
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`

- [ ] **Step 3: 루트 의존성 설치 전 package.json 스크립트 확인**

Run:
```bash
sed -n '1,220p' frontend/package.json
```

Expected:
- 기본 `dev`, `build`, `preview` 스크립트가 보인다.
- 기본 템플릿 기준 React 관련 의존성이 보인다.

- [ ] **Step 4: 커밋**

```bash
git add frontend
git commit -m "chore: scaffold frontend vite app"
```

### Task 2: 라우팅, Tailwind, 테스트 의존성 추가

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/pnpm-lock.yaml`

- [ ] **Step 1: 필요한 런타임 의존성 설치**

Run:
```bash
cd frontend && pnpm add react-router
```

Expected:
- `package.json`의 `dependencies`에 `react-router`가 추가된다.
- `pnpm-lock.yaml`이 생성되거나 갱신된다.

- [ ] **Step 2: 필요한 개발 의존성 설치**

Run:
```bash
cd frontend && pnpm add -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected:
- `package.json`의 `devDependencies`에 Tailwind, Vitest, Testing Library 관련 항목이 추가된다.

- [ ] **Step 3: 테스트 스크립트 추가 준비를 위해 package.json 확인**

Run:
```bash
sed -n '1,240p' frontend/package.json
```

Expected:
- 기본 스크립트와 새 의존성이 함께 보인다.

- [ ] **Step 4: package.json에 테스트 스크립트 추가**

`frontend/package.json`의 `scripts`를 아래처럼 맞춘다.

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run"
}
```

주의:
- 이미 설치된 의존성 버전은 `pnpm`이 기록한 값을 그대로 유지한다.
- 수동 편집은 `scripts` 추가에만 한정한다.

- [ ] **Step 5: 변경 확인**

Run:
```bash
sed -n '1,240p' frontend/package.json
```

Expected:
- `test`와 `test:run` 스크립트가 보인다.
- `react-router`와 Tailwind, Vitest 관련 의존성이 보인다.

- [ ] **Step 6: 커밋**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore: add frontend runtime and test dependencies"
```

## Chunk 2: 테스트 환경과 앱 구조 구성

### Task 3: Tailwind와 테스트 실행 환경 준비

**Files:**
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/styles/globals.css`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: `frontend/src/styles/globals.css` 작성**

```css
@import "tailwindcss";

:root {
  font-family: sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
}
```

- [ ] **Step 2: `frontend/src/test/setup.ts` 작성**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: `frontend/vite.config.ts`에 Tailwind 플러그인과 테스트 설정 추가**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
```

- [ ] **Step 4: 설정 파일 확인**

Run:
```bash
sed -n '1,220p' frontend/vite.config.ts
```

Expected:
- `tailwindcss()` 플러그인이 보인다.
- `test.environment`가 `jsdom`으로 설정되어 있다.

- [ ] **Step 5: 커밋**

```bash
git add frontend/vite.config.ts frontend/src/styles/globals.css frontend/src/test/setup.ts
git commit -m "chore: configure frontend styling and test environment"
```

### Task 4: 라우팅 스모크 테스트 먼저 작성

**Files:**
- Create: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 실패할 테스트 작성**

`frontend/src/app/App.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { RouterProvider } from "react-router/dom";
import { createMemoryRouter } from "react-router";

import { routes } from "./router";

function renderWithRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries });

  return render(<RouterProvider router={router} />);
}

describe("App routing", () => {
  it("renders the home page on root route", async () => {
    renderWithRoute(["/"]);

    expect(
      await screen.findByRole("heading", { name: /session trading frontend/i }),
    ).toBeInTheDocument();
  });

  it("renders the not found page on unknown route", async () => {
    renderWithRoute(["/missing"]);

    expect(
      await screen.findByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트를 실행해 실패를 확인**

Run:
```bash
cd frontend && pnpm test:run
```

Expected:
- `./router` 또는 관련 페이지 파일을 찾지 못한다는 실패가 발생한다.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/App.test.tsx
git commit -m "test: add failing frontend routing smoke tests"
```

### Task 5: 최소 앱 구조 구현으로 테스트 통과시키기

**Files:**
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/app/router.tsx`
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/pages/NotFoundPage.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: `frontend/src/app/router.tsx` 작성**

```tsx
import { createBrowserRouter } from "react-router";

import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const routes = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);
```

- [ ] **Step 2: `frontend/src/app/App.tsx` 작성**

```tsx
import { RouterProvider } from "react-router/dom";

import { router } from "./router";

export function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: `frontend/src/pages/HomePage.tsx` 작성**

```tsx
export function HomePage() {
  return (
    <main>
      <h1>Session Trading Frontend</h1>
      <p>React, Vite, TypeScript, Tailwind CSS, React Router bootstrap.</p>
    </main>
  );
}
```

- [ ] **Step 4: `frontend/src/pages/NotFoundPage.tsx` 작성**

```tsx
export function NotFoundPage() {
  return (
    <main>
      <h1>Page Not Found</h1>
      <p>The requested route does not exist.</p>
    </main>
  );
}
```

- [ ] **Step 5: `frontend/src/main.tsx`를 앱 진입 구조로 교체**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: 파일 구조 확인**

Run:
```bash
rg --files frontend/src
```

Expected:
- `frontend/src/app/App.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/NotFoundPage.tsx`
- `frontend/src/main.tsx`

- [ ] **Step 7: 테스트를 다시 실행해 통과 확인**

Run:
```bash
cd frontend && pnpm test:run
```

Expected:
- `App.test.tsx`의 2개 테스트가 모두 PASS 한다.

- [ ] **Step 8: 커밋**

```bash
git add frontend/src/main.tsx frontend/src/app frontend/src/pages
git commit -m "feat: implement frontend routing skeleton"
```

## Chunk 3: 빌드와 수동 검증

### Task 6: 실행 검증

**Files:**
- Verify: `frontend/package.json`
- Verify: `frontend/vite.config.ts`
- Verify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 테스트 실행으로 기본 구성이 통과하는지 확인**

Run:
```bash
cd frontend && pnpm test:run
```

Expected:
- `App.test.tsx`의 2개 테스트가 모두 PASS 한다.

- [ ] **Step 2: 프로덕션 빌드 확인**

Run:
```bash
cd frontend && pnpm build
```

Expected:
- TypeScript 오류 없이 빌드가 완료된다.
- `frontend/dist/`가 생성된다.

- [ ] **Step 3: 개발 서버 기동 확인**

Run:
```bash
cd frontend && pnpm dev --host 0.0.0.0
```

Expected:
- Vite 개발 서버가 기동된다.
- 기본 주소가 출력된다.

- [ ] **Step 4: 라우팅 수동 확인**

검증 내용:
- `/`에서 홈 문구가 보인다.
- 존재하지 않는 경로에서 `Page Not Found` 문구가 보인다.

- [ ] **Step 5: 최종 커밋**

```bash
git add frontend
git commit -m "feat: bootstrap frontend app environment"
```

## Chunk 4: 구현 메모

### Task 7: 주의사항

**Files:**
- Verify: `frontend/src/App.tsx`
- Verify: `frontend/src/index.css`
- Verify: `frontend/src/assets/react.svg`
- Verify: `frontend/public/vite.svg`

- [ ] **Step 1: 템플릿 기본 파일 삭제 금지**

주의:
- 이번 작업에서는 사용자 승인 없이 `rm`을 사용하지 않는다.
- 템플릿이 만든 `frontend/src/App.tsx`, `frontend/src/index.css`, `frontend/src/assets/react.svg`, `frontend/public/vite.svg`는 남겨둬도 된다.
- 사용하지 않는 파일은 후속 정리 작업으로 분리한다.

- [ ] **Step 2: 실제 앱은 새 구조만 사용하도록 확인**

Run:
```bash
sed -n '1,200p' frontend/src/main.tsx
```

Expected:
- 기존 `./App.tsx`나 `./index.css`를 참조하지 않는다.
- `./app/App`와 `./styles/globals.css`만 사용한다.

- [ ] **Step 3: 완료 메모 기록**

완료 후 보고 시 포함할 내용:
- 설치한 핵심 패키지 목록
- 구성한 라우트 목록
- 실행한 검증 명령과 결과
- 남아 있는 미사용 템플릿 파일 목록
