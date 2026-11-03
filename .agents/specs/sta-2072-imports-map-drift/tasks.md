---
description: "Tasks for STA-2072: imports-map drift check"
---

# Tasks: imports-map drift check

**Input**: Design documents from `.agents/specs/sta-2072-imports-map-drift/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Foundational

- [ ] T001 Test the builder: per-folder package with `src/__tests__/`, an app with `src/main.ts`, a native package with `plugin/`, a member with `scripts/`, the four-target lists, in `packages/developer/cli/src/node/functions/__tests__/imports-map.function.test.ts` — covers: FR-001, FR-002, FR-003, P-001, EC-01, EC-02, EC-03, EC-04, AC-001, AC-002, AC-003 — route: tests
- [ ] T002 Write `importsMap` in `packages/developer/cli/src/node/functions/imports-map.function.ts` — covers: FR-001, FR-002, FR-003, P-001, AC-001, AC-002, AC-003 — route: package — deps: T001

## Phase 2: User Story 1 - The repository gate refuses a drifted imports map (Priority: P1)

**Goal**: `stackra validate --repository` reports every member whose map differs from the generated one.

**Independent Test**: a temporary workspace with a member missing an alias gives one finding naming it; with the
generated map, none.

- [ ] T003 [US1] Test the check (missing, extra and retargeted aliases, key order, no `imports`, a `config` member) in `packages/developer/cli/src/node/functions/__tests__/imports-map.function.test.ts` — covers: FR-004, FR-005, P-002, EC-05, EC-06, EC-07, AC-004, AC-005, AC-006 — route: tests — deps: T002
- [ ] T004 [US1] Write `importsMapFindings` in `packages/developer/cli/src/node/functions/imports-map-findings.function.ts` — covers: FR-004, FR-005, P-002, AC-004, AC-005, AC-006 — route: package — deps: T003
- [ ] T005 [US1] Add the check to `packages/developer/cli/src/node/constants/validate-command.constant.ts` — covers: FR-004, AC-004 — route: package — deps: T004
- [ ] T006 [US1] Regenerate the `imports` map of every checked member from an untracked ci-box script, apply the printed diff, format with oxfmt, and confirm no key is removed and no first target changes, in `apps/*/package.json`, `packages/*/*/package.json`, `services/*/package.json` and `workers/*/package.json` — covers: FR-007, P-003, SC-004, AC-008 — route: package — deps: T005
- [ ] T007 [US1] Run `stackra validate --repository` on ci-box and record that no imports-map finding remains, for `packages/developer/cli/src/node/constants/validate-command.constant.ts` — covers: FR-007, SC-003, AC-008 — route: verify-fix — deps: T006

## Phase 3: User Story 2 - `stackra new` writes the generated map (Priority: P2)

**Goal**: a new member passes the check without an edit.

**Independent Test**: scaffold a package and a console app; each map equals `importsMap(dest)`.

- [ ] T008 [US2] Assert the scaffolded package and console app maps equal `importsMap(dest)` in `packages/developer/cli/src/node/scaffold/functions/__tests__/scaffold.test.ts` — covers: FR-006, SC-002, AC-007 — route: tests — deps: T002
- [ ] T009 [US2] Write `importsMap(dest)` for every kind but tooling and drop `aliasOf` and `packageImports` in `packages/developer/cli/src/node/scaffold/functions/scaffold.function.ts`, and drop the `imports` field from `tools/scaffold/templates/apps/console/package.json`, `tools/scaffold/templates/apps/desktop/package.json` and `tools/scaffold/templates/apps/mobile/package.json` — covers: FR-006, AC-007 — route: package — deps: T008

## Phase 4: Polish

- [ ] T010 [P] Move the map check from planned to automated in `apps/docs/src/docs/adr/0233-imports-use-subpath-aliases-only.mdx` and name it in the `validate --repository` row of `packages/developer/cli/README.md` — covers: FR-004, AC-004 — route: steward-docs — deps: T005
- [ ] T011 [P] Add a changeset for `@stackra/cli` in `.changeset/sta-2072-imports-map-drift.md` — covers: SC-005, AC-004 — route: steward-changesets — deps: T005
- [ ] T012 Run the CLI package's gate and the typecheck, test and build of the members whose `package.json` changed on ci-box, for `packages/developer/cli/package.json` — covers: SC-001, SC-002, SC-004, SC-005, AC-001, AC-007, AC-008 — route: verify-fix — deps: T006, T007, T009, T010, T011
