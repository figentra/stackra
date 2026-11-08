---
description: "Tasks for STA-2067: the TypeScript SDK keeps a base-URL prefix; every SDK creates the Idempotency-Key"
---

# Tasks: SDK fixes: the TypeScript SDK keeps a base-URL prefix, and every SDK creates the Idempotency-Key

**Input**: Design documents from `.agents/specs/sta-2067-sdk-fixes/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Confirm the gen tests pass on ci-box before any edit, in `packages/developer/gen/package.json` — covers: SC-002, AC-001, AC-002 — route: gen

## Phase 2: User Story 1 - A TypeScript caller behind a path prefix reaches the API (Priority: P1)

**Goal**: the TypeScript SDK requests `<baseUrl><path>`, keeping a path prefix.

**Independent Test**: the transpiled TypeScript SDK with a fake fetch, a prefixed base URL and one with a trailing slash.

- [x] T002 [US1] Test first: run the emitted TypeScript SDK with a prefixed base URL and a trailing slash in `packages/developer/gen/src/core/functions/__tests__/emit-sdks.function.test.ts` — covers: FR-001, P-001, EC-01, EC-02, AC-001 — route: tests — deps: T001
- [x] T003 [US1] Concatenate the trimmed base URL and the path in `packages/developer/gen/src/core/functions/emit-sdks.function.ts` — covers: FR-001, P-001, AC-001 — route: gen — deps: T002

## Phase 3: User Story 2 - A retried write runs once without the caller minting a key (Priority: P1)

**Goal**: every SDK sends a generated `Idempotency-Key` on a write with no caller key.

**Independent Test**: the transpiled TypeScript SDK with a fake fetch; the Python and PHP text.

- [x] T004 [US2] Test first: a generated UUID on a write with no key, the caller's key when passed, none on a GET, and the Python and PHP generator inside call in `packages/developer/gen/src/core/functions/__tests__/emit-sdks.function.test.ts` — covers: FR-002, FR-003, P-002, P-003, EC-03, AC-002 — route: tests — deps: T003
- [x] T005 [US2] Default the key once per call in the TypeScript, Python and PHP call bodies in `packages/developer/gen/src/core/functions/emit-sdks.function.ts` — covers: FR-002, FR-003, P-002, P-003, EC-04, AC-002 — route: gen — deps: T004

## Phase 4: Polish

- [x] T006 [P] Say the SDKs keep a base-URL prefix and generate the key in `packages/developer/gen/README.md` — covers: SC-001, AC-001, AC-002 — route: steward-docs — deps: T005
- [ ] T007 Run gen test, typecheck, lint and pnpm verify on ci-box, and add a patch changeset in `.changeset/sta-2067-sdk-fixes.md` — covers: SC-001, SC-002, AC-001, AC-002 — route: verify-fix — deps: T005, T006
