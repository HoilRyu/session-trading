# Database Docker Setup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 루트 Compose 진입점과 `database/Dockerfile`만으로 TimescaleDB 기반 데이터베이스 컨테이너를 실행 가능한 상태로 만든다.

**Architecture:** 루트 `docker-compose.yml`은 `db` 서비스 하나를 정의하고, 실제 이미지는 `database/Dockerfile`에서 빌드한다. 데이터 초기화는 제외하고, 로컬 개발에 필요한 환경변수 기본값, named volume, 포트 바인딩, 헬스체크만 포함한다.

**Tech Stack:** Docker Compose, Dockerfile, TimescaleDB, PostgreSQL

---

## 파일 구조

- 생성: `docker-compose.yml`
- 생성: `database/Dockerfile`

## 참고 스펙

- [database docker spec](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/docs/superpowers/specs/2026-03-16-database-docker-design.md)

## Chunk 1: DB 컨테이너 정의

### Task 1: Compose 파일 작성

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Compose 스켈레톤 작성**

`docker-compose.yml`에 Compose 버전, `db` 서비스, 빌드 경로를 정의한다.

- [ ] **Step 2: 로컬 개발용 환경변수 기본값 추가**

`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_PORT` 기본값을 `${VAR:-default}` 형식으로 정의한다.

- [ ] **Step 3: 볼륨, 포트, 헬스체크 추가**

named volume, `127.0.0.1` 포트 바인딩, `pg_isready` 헬스체크를 추가한다.

- [ ] **Step 4: 정적 설정 검증**

Run:
```bash
docker compose config
```

Expected:
- Compose 설정이 정상적으로 렌더링된다.

### Task 2: Dockerfile 작성

**Files:**
- Create: `database/Dockerfile`

- [ ] **Step 1: TimescaleDB 베이스 이미지 지정**

`ARG TIMESCALE_IMAGE=timescale/timescaledb:2.25.2-pg17`와 `FROM`을 사용해 추후 이미지 교체 여지를 남긴다.

- [ ] **Step 2: 메타데이터와 설명 추가**

이미지 용도를 설명하는 최소 라벨을 추가한다.

- [ ] **Step 3: 빌드 검증**

Run:
```bash
docker compose build db
```

Expected:
- `db` 이미지가 성공적으로 빌드된다.

## Chunk 2: 기동 검증

### Task 3: 컨테이너 실행과 상태 확인

**Files:**
- Verify only: `docker-compose.yml`
- Verify only: `database/Dockerfile`

- [ ] **Step 1: DB 컨테이너 기동**

Run:
```bash
docker compose up -d db
```

Expected:
- `db` 컨테이너가 백그라운드에서 실행된다.

- [ ] **Step 2: 상태 확인**

Run:
```bash
docker compose ps db
```

Expected:
- `db` 서비스가 `running` 또는 `healthy` 상태를 보인다.

- [ ] **Step 3: DB 준비 상태 확인**

Run:
```bash
docker compose exec db pg_isready -U ${POSTGRES_USER:-session_trading} -d ${POSTGRES_DB:-session_trading}
```

Expected:
- 데이터베이스가 연결 가능 상태라고 출력된다.

- [ ] **Step 4: 정리**

Run:
```bash
docker compose down
```

Expected:
- 컨테이너는 정리되고 named volume은 유지된다.
