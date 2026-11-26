---
description: "Tasks for STA-2863: deprecate known-bad versions and move dist-tags through the release workflow"
---

# Tasks: deprecate known-bad versions and move dist-tags through the release workflow

**Input**: Design documents from `.agents/specs/sta-2863-registry-deprecations/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The list and the script

**Goal**: a reviewed list and a script that plans, applies and scans it.

- [x] T001 Test first: the file's refusals, the plan (wildcards, compare-and-set, problems), apply (tokens, order, masking, verify), scan and the exit codes in `tools/scripts/__tests__/registry-maintain.test.mjs` — covers: FR-001, FR-002, FR-003, FR-004, FR-005, P-001, P-002, P-003, P-004, P-005, P-006, EC-01, EC-02, EC-03, EC-04, EC-06, AC-003, AC-004, AC-005 — route: tests
- [x] T002 Write `tools/scripts/registry-maintain.mjs` (plan, apply, scan) — covers: FR-001, FR-002, FR-003, FR-004, FR-005, EC-05 — route: tooling — deps: T001
- [x] T003 Write `tools/release/registry-actions.json` naming 0.33.1, 0.28.0 and 0.10.0 and the `latest` move, held valid by the same test file — covers: FR-007, AC-006 — route: tooling — deps: T002
- [x] T004 Accept the file as strict JSON in `packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts`, tested in `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts` — covers: FR-008 — route: package — deps: T003

## Phase 2: User Story 1 - The registry shows the deprecation and the tag move (Priority: P1)

**Independent Test**: the script against the Worker in memory.

- [x] T005 [US1] Test the script against the Worker (the release workflow, an unapproved environment, a re-run after the next release) in `workers/registry/src/publish/__tests__/registry-maintain.test.ts` — covers: AC-001, AC-002, AC-003, EC-07 — route: tests — deps: T002

## Phase 3: User Story 3 - The workflow (Priority: P2)

- [x] T006 [US3] Add the `registry_maintenance` dispatch, its concurrency group, the guards on the release jobs and the `registry-plan` and `registry-maintenance` jobs to `.github/workflows/release.yml` — covers: FR-006 — route: tooling — deps: T002

## Phase 4: Polish

- [x] T007 Document the workflow, the known-bad versions and Revert in `apps/docs/src/docs/runbooks/release.mdx` and `workers/registry/README.md`, with `.changeset/registry-actions-stay-json.md` — covers: SC-001, SC-002, SC-003 — route: steward-docs — deps: T006
- [x] T008 Run the touched tests, typecheck, oxlint, oxfmt, actionlint, zizmor, `stackra validate --repository`, `doc-standard`, the six script mutations and a read-only `plan` and `scan` against the live registry, in `tools/scripts/registry-maintain.mjs` — covers: SC-001, SC-002, SC-003, SC-004 — route: verify-fix — deps: T007
- [x] T009 Write this spec from the built change in `.agents/specs/sta-2863-registry-deprecations/spec.md` — covers: SC-004 — route: steward-docs — deps: T008
- [ ] T010 The owner dispatches `plan`, then `apply`, approves `release`, and `pnpm view` shows the deprecations and `latest` at 0.33.0, recorded on STA-2863 in `tools/release/registry-actions.json` — covers: SC-005 — route: verify-fix — deps: T009
