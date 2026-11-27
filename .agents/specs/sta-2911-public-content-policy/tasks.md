---
description: "Tasks for STA-2911: a public-content guard driven by a policy file"
---

# Tasks: a public-content guard driven by a policy file

**Input**: Design documents from `.agents/specs/sta-2911-public-content-policy/`

**Prerequisites**: plan.md, spec.md

## Phase 1: User Story 1 - A repository says what it denies and waives (Priority: P1)

**Goal**: the deny list and the exemptions come from one checked policy file.

**Independent Test**: `node --test tools/scripts/__tests__/guard-public-content.test.mjs`.

- [x] T001 [US1] the recommended list, `parsePolicy`, `readPolicy`, `--policy`, `--recommended` and the `deny` shape of `--hash` in `tools/scripts/guard-public-content.mjs` — covers: FR-001, FR-002, FR-003, FR-004, FR-006, NFR-001, AC-001, AC-002, AC-003, P-001, P-002, P-004 — route: spec-task
- [x] T002 [US1] the policy file `tools/scripts/public-content.policy.yaml` (renamed from the STA-2876 allow list, with `deny` and `waive` added) — covers: FR-002, AC-005 — route: spec-task — deps: T001
- [x] T003 [US1] tests in `tools/scripts/__tests__/guard-public-content.test.mjs` — covers: FR-001 to FR-006, FR-009, AC-001, AC-002, AC-003, AC-006, SC-001 — route: tests — deps: T001

## Phase 2: User Story 2 - An internal name is stopped before it is committed (Priority: P1)

**Goal**: the guard runs before each commit and in validate.

**Independent Test**: the wiring test and a staged file under lefthook.

- [x] T004 [US2] `--files` in `tools/scripts/guard-public-content.mjs` — covers: FR-005, AC-004, P-003 — route: spec-task — deps: T001
- [x] T005 [US2] `pnpm public-content` in `package.json` and in `validate` — covers: FR-007, AC-005 — route: spec-task — deps: T001
- [x] T006 [US2] the pre-commit job in `.flow/overrides/hooks/lefthook.yml.txt` and `.flow/overrides/hooks/lefthook.yml`, rendered into `lefthook.yml` and `.flow/lock.json` — covers: FR-008, NFR-002, AC-004, SC-002 — route: spec-task — deps: T004

## Phase 3: Polish

- [x] T007 [P] docs in `tools/scripts/README.md` and `apps/docs/src/docs/runbooks/release.mdx` — covers: FR-007, FR-008, AC-007 — route: steward-docs — deps: T006
