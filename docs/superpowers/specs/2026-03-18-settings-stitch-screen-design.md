# 설정 화면 Stitch 생성 설계서

## 개요

- 작성일: 2026-03-18
- 대상 Stitch 프로젝트: `projects/3231459091629688405`
- 목적: 기존 `session-trading` Stitch 프로젝트의 `Market / Chart Dashboard` 화면과 통일감 있는 `Settings` 데스크톱 화면을 생성하기 위한 시각/구조 프롬프트를 확정한다.

## 참조 기준

- 참조 화면: `projects/3231459091629688405/screens/a15090ae05d84bdab3e896d1d863ecb6`
- 참조 화면 제목: `Market / Chart Dashboard`
- 참조 로컬 설계:
  - `docs/superpowers/specs/2026-03-18-settings-page-design.md`
  - `docs/superpowers/specs/2026-03-18-market-chart-desktop-stitch-design.md`
  - `docs/superpowers/specs/2026-03-18-investment-status-layout-design.md`

## 기존 Stitch 화면에서 유지할 핵심 규칙

### 1. 앱 셸은 거의 그대로 유지한다

- 좌측 고정 사이드바
- 상단 앱바
- 본문 비대칭 2열 구조
- 기관형 데스크톱 대시보드 밀도

설정 화면도 같은 제품의 다른 탭처럼 보여야 하므로, 화면 종류가 달라져도 앱 셸의 골격은 바꾸지 않는다.

### 2. 시각 톤은 다크 건메탈 + 시안 포인트를 유지한다

- 배경: `surface`, `surface_container`, `surface_container_low`
- 포인트: `primary_container` 계열 시안
- 타이포: `Inter` 중심, 수치와 상태값은 `JetBrains Mono`
- 경계: 강한 실선 대신 저대비 ghost border
- 밀도: 작은 uppercase 라벨과 조밀한 정보 배치

### 3. 장식보다 운영 콘솔 느낌을 우선한다

- 큰 일러스트, 과장된 그래프, 소비자용 히어로 배너는 넣지 않는다
- 설정 페이지라도 단순 폼 모음이 아니라 운영 중인 트레이딩 도구의 제어 패널처럼 보여야 한다

## 화면 방향 비교

### 1. 셸 고정형

- 장점: 가장 안전하고 기존 화면과 유사함
- 단점: 설정/진단의 특성이 약해질 수 있음

### 2. 운영 콘솔형

- 장점: 기존 72/28 비대칭 구조를 살리면서 `설정 + 운영 제어 + 진단`을 함께 담기 좋음
- 단점: 우측 패널 정보 밀도 조절이 필요함

### 3. 폼 중심형

- 장점: 입력 집중도가 높음
- 단점: 기존 Stitch 화면의 기관형 대시보드 감각이 약해짐

## 최종 선택

- 최종 방향은 `운영 콘솔형`으로 한다.

선택 이유:

- 기존 `Market / Chart Dashboard`의 강한 비대칭 구조를 그대로 활용할 수 있다.
- 설정 페이지 설계서의 핵심인 `저장 설정 + 운영 제어 + 진단 정보`를 한 화면 안에서 자연스럽게 분리할 수 있다.
- 단순한 관리 폼이 아니라 실제 운영 중인 트레이딩 시스템의 설정 콘솔처럼 보이게 만들 수 있다.

## 설정 화면 정보 구조

### 좌측 72%: 설정 작업 영역

- `General`
  - 기본 거래소
  - 기본 진입 화면
- `Market Data`
  - 거래소별 활성화 토글
  - 기본 quote
  - 기본 정렬 기준/방향
  - 폴링 주기
  - 자동 새로고침
  - 목록 기본 개수
- `Chart Defaults`
  - 기본 거래소
  - 기본 심볼
  - 기본 타임프레임
  - 차트 테마
  - 거래량 표시 여부
- `Operations`
  - 마켓 동기화 실행
  - 거래소별 스트림 시작/중지
  - 거래소별 auto start
  - 섹션별 기본값 복원

### 우측 28%: 상태/진단 패널

- `Backend Status`
- `Last Saved`
- `Environment`
- `Stream Health`
- `Recent Actions`
- `Last Error`

## 상호작용 표현 규칙

- 저장 설정은 `편집 후 저장` 흐름으로 표현한다
- 운영 제어는 `즉시 실행` 성격이 드러나야 한다
- 진단 정보는 읽기 전용 카드/리스트처럼 보이게 한다
- 비동작 기능을 암시하는 요소는 넣지 않는다

## 금지사항

- 밝은 테마 전환
- 둥근 소비자형 카드 스타일
- 큰 장식 일러스트와 과한 그래디언트 배경
- 가짜 트레이드 버튼
- 구현 근거 없는 검색창 남용
- 서구식 손익 색 규칙
- 본문 전체를 동일 폭 카드 그리드로 단순화하는 구성

## 실행 결과

- 1차 생성 화면: `projects/3231459091629688405/screens/369ca918236c4d84a08c1f6abb3164d2`
  - 제목: `Settings Dashboard`
  - 평가: 설정 정보 구조는 적절했지만, 기존 `Market / Chart Dashboard` 대비 사이드바 정보 구조와 브랜딩 일치도가 부족했다.
- 최종 선택 화면: `projects/3231459091629688405/screens/6b86f37e2f5a4194b8f585ad07e5dfe2`
  - 제목: `Settings Console - Institutional`
  - 평가: 기존 프로젝트 셸과 브랜딩을 더 직접적으로 맞춘 버전으로 채택한다.

## 최종 Stitch 생성 프롬프트

```text
Create another desktop Settings screen for the existing 'session-trading' project, but this time match the existing 'Market / Chart Dashboard' shell and branding much more literally. This is not a redesign of the product. It is the Settings tab inside the exact same product shell.

Hard requirements for shell fidelity:
- Reuse the same left sidebar information architecture as the existing screen.
- Brand header should read exactly 'Session Trading' with the small subtitle 'Institutional Grade'.
- Sidebar groups should be exactly:
  - Dashboard -> Dashboard
  - Investment -> Investment Status, Market / Chart
  - Others -> Settings
- Settings must be the active nav item.
- Keep the same fixed left sidebar feel, same dense typography, same dark gunmetal surfaces, same subtle outline borders, and same institutional trading terminal mood.
- Keep the same top app bar structure and tone as the existing screen: title + short subtitle on the left, compact controls on the right. The right-side primary action may be 'Save Changes'.
- Do not invent a new product identity, new menu taxonomy, or new app personality.
- Use Inter for UI and headings. Use JetBrains Mono only for numeric/system values. Do not use Public Sans or any alternate display font.
- Do not use bright green health indicators. Active/system status should use cyan or muted neutral tones consistent with the existing project.
- Do not use western red/green finance semantics. Only use Korean finance semantics if market-style up/down values appear.

Page purpose:
Design an operations-oriented Settings console that still feels like a sibling of the Market / Chart Dashboard.

Main layout:
- Desktop only
- Same overall shell
- Main content split asymmetrically into about 72% left / 28% right

Left 72% column:
- compact Settings page header with a short operational subtitle
- a slim status strip for save state, pending changes, last saved time
- four stacked dark cards/sections:
  1. General
     - default exchange
     - default route
  2. Market Data
     - exchange enable toggles
     - default quote
     - default sort field and direction
     - poll interval
     - auto refresh
     - default page size
  3. Chart Defaults
     - default exchange
     - default symbol
     - default timeframe
     - chart theme
     - show volume
  4. Operations
     - run market sync
     - start/stop ticker streams by exchange
     - auto start by exchange
     - section reset actions

Right 28% column:
- diagnostics console with compact stacked cards for:
  - backend status
  - environment
  - stream health by exchange
  - last error
  - recent actions log
  - copy debug info action

Style constraints:
- use layered surfaces close to the original screen's surface / surface-container / surface-container-low system
- use ghost borders and subtle separators rather than obvious boxed SaaS cards
- restrained rounding only
- dense uppercase micro-labels
- asymmetrical editorial spacing
- avoid playful admin-dashboard tropes
- avoid generic enterprise settings aesthetics
- avoid search-heavy admin UI if it weakens fidelity

The result should look like the original Market / Chart Dashboard and this new Settings screen were designed together as part of the same institutional crypto trading desktop app.
```
