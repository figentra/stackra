---
description: "Tasks for STA-2860: a Worker deploy streams its output and prints one line per phase, secrets masked"
---

# Tasks: a Worker deploy streams its output and prints one line per phase, secrets masked

**Input**: Design documents from `.agents/specs/sta-2860-runway-streamed-deploy-log/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The runner streams

**Goal**: `runProgram` hands each line over while the program runs.

- [x] T001 Test first: a line arrives while the program waits for the caller, a split line arrives whole, nothing streams without `onLine`, a program that cannot start fails, in `packages/developer/runway/src/node/functions/__tests__/run-program.function.test.ts` — covers: FR-001, P-001, EC-01, EC-02, EC-03, AC-005 — route: tests
- [x] T002 Add `onLine` to `packages/developer/runway/src/node/types/command-runner.type.ts` and stream through `spawn` in `packages/developer/runway/src/node/functions/run-program.function.ts` — covers: FR-001, P-001, EC-01, EC-02, EC-03, EC-04, AC-005 — route: package — deps: T001

## Phase 2: User Story 2 - Nothing secret reaches the log (Priority: P1)

- [x] T003 [US2] Test first: every value, the longest first, multi-line secrets line by line, an empty value, in `packages/developer/runway/src/core/functions/__tests__/mask-secrets.function.test.ts` — covers: FR-004, P-003, EC-05, AC-003 — route: tests
- [x] T004 [US2] Add `maskSecrets` in `packages/developer/runway/src/core/functions/mask-secrets.function.ts` — covers: FR-004, P-003, EC-05, AC-003 — route: package — deps: T003

## Phase 3: User Story 1 - A deploy shows where it is (Priority: P1)

**Independent Test**: the driver against the fake Cloudflare with `log` captured.

- [x] T005 [US1] Test first: the phase lines of a 10/50/100 rollout, each failed smoke attempt, the rollback, verify and rollback lines, streamed output masked, a smoke bearer masked in verify, a masked failure, standard error by default, in `packages/developer/runway/src/node/drivers/__tests__/cloudflare-workers-provider.driver.test.ts` — covers: FR-002, FR-003, FR-004, FR-005, P-002, P-003, P-004, P-005, EC-06, EC-07, AC-001, AC-002, AC-003, AC-004 — route: tests — deps: T002, T004
- [x] T006 [US1] Add `log`, `say`, `mask` and `exec` and the phase lines in `packages/developer/runway/src/node/drivers/cloudflare-workers-provider.driver.ts` — covers: FR-002, FR-003, FR-004, FR-005, P-002, P-003, P-004, P-005, EC-06, EC-07, AC-001, AC-002, AC-003, AC-004 — route: package — deps: T005

## Phase 4: Polish

- [x] T007 Document the deploy log and the masking rule in `packages/developer/runway/README.md`, `packages/developer/runway/AGENTS.md` and `.changeset/runway-streamed-deploy-log.md` — covers: SC-001, SC-002, AC-001, AC-003 — route: steward-docs — deps: T006
- [x] T008 Run the `@stackra/runway` tests, typecheck, oxlint and oxfmt, and the revert check, in `packages/developer/runway/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T007
