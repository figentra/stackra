---
description: "Tasks for STA-229: the ADR 0182 coverage floors run, and the box verify runs the int tier"
---

# Tasks: the ADR 0182 coverage floors run, and the box verify runs the int tier

**Input**: Design documents from `.agents/specs/sta-229-coverage-floors/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The floors

**Goal**: each member gets its ADR 0182 floor.

- [x] T001 Test first: the two floors, the strict list covering every security package, the root and working-directory lookups and a lowered override in `packages/tooling/vitest/src/__tests__/coverage.test.ts` — covers: FR-001, FR-002, P-001, P-002, P-003, EC-01, EC-02, EC-03, AC-001, AC-002 — route: tests
- [x] T002 Add `STRICT_COVERAGE_PACKAGES` in `packages/tooling/vitest/src/constants/strict-coverage-packages.constant.ts`, `STRICT_COVERAGE_THRESHOLDS` in `packages/tooling/vitest/src/constants/strict-coverage-thresholds.constant.ts`, `coverageThresholdsFor` in `packages/tooling/vitest/src/functions/coverage-thresholds-for.function.ts` and `readPackageName` in `packages/tooling/vitest/src/functions/read-package-name.function.ts`, apply the floor in `packages/tooling/vitest/src/functions/with-coverage.function.ts`, export them from `packages/tooling/vitest/src/coverage.ts` and widen `CoverageOverrides` in `packages/tooling/vitest/src/types/coverage-overrides.type.ts` — covers: FR-001, FR-002, P-001, P-002, AC-001, AC-002 — route: package — deps: T001

## Phase 2: User Story 2 - The box verify runs the int tier and the floors (Priority: P1)

**Goal**: `pnpm verify:box` and the testbed preset run `test:int` and `test:coverage`.

- [x] T003 [US2] Test first: the `verify:box` chain, the services filter, the preset and the gate membership in `tools/scripts/__tests__/coverage-gate.test.mjs` — covers: FR-003, FR-004, P-004, AC-003, AC-005 — route: tests
- [x] T004 [US2] Add `verify:box` and widen `test:coverage` in `package.json`, run it from `.github/workflows/testbed-fallback.yml`, describe it in `turbo.jsonc`, and add `test:coverage` to `packages/design-system/showcase/package.json` — covers: FR-003, FR-004, AC-003, AC-005 — route: package — deps: T003

## Phase 3: User Story 1 - A security package below 90% fails the gate (Priority: P1)

**Goal**: `stackra check --with-tests` and `stackra test --coverage` run the floors.

- [x] T005 [US1] Test first: the `coverage` phase, its opt-in and its `--affected` filter in `packages/developer/cli/src/node/constants/__tests__/check-phases.constant.test.ts` and `packages/developer/cli/src/node/functions/__tests__/parse-check-options.function.test.ts` — covers: FR-005, P-005, EC-05, EC-06, AC-004 — route: tests
- [x] T006 [US1] Add `COVERAGE_PHASE` in `packages/developer/cli/src/node/constants/coverage-phase.constant.ts`, `OPT_IN_PHASES` in `packages/developer/cli/src/node/constants/opt-in-phases.constant.ts` and `runTurboTaskPhase` in `packages/developer/cli/src/node/functions/run-turbo-task-phase.function.ts`, move `TEST_PHASE` onto it in `packages/developer/cli/src/node/constants/test-phase.constant.ts`, list the phase in `packages/developer/cli/src/node/constants/check-phases.constant.ts` and opt it in through `packages/developer/cli/src/node/functions/parse-check-options.function.ts` — covers: FR-005, P-005, AC-004 — route: package — deps: T005
- [x] T007 [US1] Test first, then add `--coverage` to `stackra test` in `packages/developer/cli/src/node/functions/resolve-tool.function.ts` and `packages/developer/cli/src/node/functions/tool-command.function.ts` — covers: FR-006, EC-04, AC-006 — route: package — deps: T006

## Phase 4: User Story 3 - A new member cannot slip out of the gate (Priority: P2)

- [x] T008 [US3] Test first, then write `test:coverage` and `@vitest/coverage-v8` in `packages/developer/cli/src/node/functions/service-template.function.ts`, with the provider pinned in `packages/developer/cli/src/node/constants/service-catalogs.constant.ts` — covers: FR-007, AC-005 — route: package — deps: T006

## Phase 5: Meet the floors

- [x] T009 Exclude tenancy's int-only half in `packages/security/tenancy/vitest.config.ts`, add the e2e helper tests under `packages/developer/testing/src/e2e/`, and give the slow PGlite suites explicit timeouts — covers: FR-008, EC-07, SC-004 — route: tests — deps: T002

## Phase 6: Polish

- [x] T010 Document the floors, the phase, the flag and `verify:box` in `apps/docs/src/docs/adr/0182-testing-strategy-v2-tiers-coverage-infrastructure-and-policies.mdx`, `apps/docs/src/docs/standards/testing.mdx`, `apps/docs/src/docs/runbooks/test-infrastructure.mdx`, `.github/workflows/README.md`, `AGENTS.md` (rendered from `flow.config.json`, hashed in `.flow/lock.json`), `packages/tooling/vitest/README.md`, `packages/developer/cli/README.md` and two changesets — covers: SC-001, SC-002, SC-003 — route: steward-docs — deps: T008
- [ ] T011 Run `pnpm verify:box` on the box after the merge, from `package.json` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T010
