# Feature Specification: the ADR 0182 coverage floors run, and the box verify runs the int tier

**Feature Branch**: `figentra/sta-229-coverage-floors`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-229

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0182 decision 2 sets coverage floors: 80% lines and functions and 70% branches for every package, and
90/90/80 for security, tenancy, IAM, actions, outbox, workflow, versioning, validation and licensing. Before this
change every member got 80/80/70 from `@stackra/vitest-config/coverage`, nothing ran `test:coverage` (the root script
covered packages only, no workflow or check called it, and `stackra check`'s test phase said "coverage floors are not
run here yet"), and the integration tier (`test:int`) was not part of the box's verify. A release could ship with a
security package under its floor and with a broken int tier, and no gate would say so.

### Sources

- `packages/tooling/vitest/src/constants/coverage-thresholds.constant.ts` (the single 80/80/70 floor before this change)
- `packages/tooling/vitest/src/functions/with-coverage.function.ts` (the wrapper every member's config uses)
- `packages/developer/cli/src/node/constants/test-phase.constant.ts` ("the coverage floors are not run here yet")
- root `package.json` (`test:coverage` over `./packages/**` only, `verify` without `test:int`) and `turbo.jsonc`
  (`test:coverage`, `test:int`)
- `.github/workflows/testbed-fallback.yml` (the `verify` preset ran `pnpm verify`)
- ADR 0182 decision 1 (the tiers, `test:int`) and decision 2 (coverage floors); ADR 0282 decision 3 (`stackra check`
  phases); ADR 0484 decision 11 (testbed presets); ADR 0022 (test placement)
- FR-001 to FR-008: the PR's diff against `main` and its tests (`coverage.test.ts`, `coverage-gate.test.mjs`,
  `check-phases.constant.test.ts`, `parse-check-options.function.test.ts`, `resolve-tool.function.test.ts`,
  `tool-command.function.test.ts`, `service-template.function.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (apps stay outside the coverage gate, as before)
- **Services touched**: none directly; every service is now in `pnpm test:coverage`, and `stackra new service` writes
  `test:coverage`
- **Packages touched**: packages/tooling/vitest (`@stackra/vitest-config/coverage`), packages/developer/cli (`stackra
check` phases, `stackra test --coverage`, the service scaffold), packages/security/tenancy (its coverage excludes),
  packages/developer/testing (new e2e helper tests), packages/design-system/showcase (`test:coverage` script),
  packages/data/database and packages/security/tenancy (explicit timeouts on two PGlite suites)
- **Public contract change**: additive. `@stackra/vitest-config/coverage` exports `STRICT_COVERAGE_PACKAGES`,
  `STRICT_COVERAGE_THRESHOLDS` and `coverageThresholdsFor(name)`; `withCoverage` keeps its signature and now picks the
  member's floor; `CoverageOverrides.thresholds` widens from the frozen literal values to any number. `stackra check`
  gains the opt-in `coverage` phase; `stackra test` gains `--coverage`; the root gains `pnpm verify:box`. Behaviour
  change: a package in `STRICT_COVERAGE_PACKAGES` now fails `test:coverage` below 90/90/80.
- **Cross-service events**: none
- **Tenancy and data**: none (test configuration only)
- **Security and privacy**: none; the strict floor covers the security packages more tightly.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0182 decision 2 as written, and decision 1's int tier in the box verify)
- **New dependencies**: none (`@vitest/coverage-v8` is already in the `quality` catalog; the service scaffold names it)
- **Deploy modes**: same in all three (development tooling only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0182 Enforcement section, `apps/docs/src/docs/standards/testing.mdx`,
  `apps/docs/src/docs/runbooks/test-infrastructure.mdx`, `.github/workflows/README.md`, root `AGENTS.md` (and
  `flow.config.json`, which renders it), `packages/tooling/vitest/README.md`, `packages/tooling/vitest/AGENTS.md`,
  `packages/developer/cli/README.md`, changesets for `@stackra/vitest-config` and `@stackra/cli`
- **Lane**: full (new exports in a published preset and a new check phase and flag in the CLI)
- **Change risk**: R1 (a package in the strict group that was between 80 and 90 now fails `test:coverage`; every such
  package on the branch meets the floor or excludes its int-only half with a reason)

## Glossary _(full lane)_

- **Floor**: the lines, functions and branches percentages a member's unit tier must reach under `vitest run
--coverage`.
- **Strict group**: the packages in `STRICT_COVERAGE_PACKAGES`, held to 90/90/80.
- **Box verify**: `pnpm verify:box`, what the testbed's `verify` preset and the tester lane run: `pnpm verify`, then
  `pnpm test:int`, then `pnpm test:coverage`.
- **Int tier**: a member's `.int.test.ts` files on a Testcontainers Postgres (`test:int`, ADR 0182 decision 1).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A security package below 90% fails the gate (Priority: P1)

A maintainer lowers the tests of `@stackra/iam` so its lines fall to 85%. The box verify fails on
`@stackra/iam#test:coverage`, and `stackra check --with-tests` reports one `coverage` finding naming that task.

**Why this priority**: ADR 0182's strict floors protect the packages whose bugs leak data; they did not run.

**Independent Test**: `coverageThresholdsFor` and `withCoverage` with a temporary member root, and `COVERAGE_PHASE` with
`runCaptured` replaced by a turbo output that names a failed task.

**Acceptance Scenarios**:

1. **Given** a member root whose `package.json` names `@stackra/iam`, **When** its config is wrapped in `withCoverage`,
   **Then** the thresholds are lines 90, functions 90, branches 80.
2. **Given** a member named `@stackra/cache`, **When** wrapped, **Then** the thresholds are 80/80/70.
3. **Given** turbo exits 1 with `Failed: @stackra/iam#test:coverage`, **When** the `coverage` phase runs, **Then** it
   returns one `failed` finding with ADR `0182` naming `@stackra/iam#test:coverage`.

---

### User Story 2 - The box verify runs the int tier and the floors (Priority: P1)

The tester lane runs `testbed run "core STA-n" . "pnpm verify:box"`, or `stackra testbed run --preset verify --ref
<ref>` when no box is healthy. Both run the repo gate, then `test:int`, then `test:coverage`, stopping at the first
failure.

**Why this priority**: the int tier and the floors catch a bad release that the unit gate passes.

**Independent Test**: `coverage-gate.test.mjs` reads the root `package.json` and `testbed-fallback.yml`.

**Acceptance Scenarios**:

1. **Given** the root `package.json`, **Then** `verify:box` is exactly `pnpm verify && pnpm test:int && pnpm
test:coverage`, and `test:coverage` filters both `./packages/**` and `./services/**`.
2. **Given** `testbed-fallback.yml`, **Then** its `verify` preset step runs `pnpm verify:box`.

---

### User Story 3 - A new member cannot slip out of the gate (Priority: P2)

A contributor adds a package or a service with a `test` script. A repo test fails until it also has `test:coverage`;
`stackra new service` writes that script and the v8 provider for them.

**Acceptance Scenarios**:

1. **Given** any member under `packages/` or `services/` with a `test` script (other than the five tooling presets),
   **Then** it has a `test:coverage` script.
2. **Given** `stackra new service demo`, **Then** its `package.json` has `"test:coverage": "stackra test --coverage"`
   and `@vitest/coverage-v8` from `catalog:quality`.
3. **Given** a new package under `packages/security/`, **Then** a test fails until it is in `STRICT_COVERAGE_PACKAGES`.

---

### Edge Cases

- **EC-01**: A member with no readable `package.json`, or one without a string `name`, gets the default floor.
- **EC-02**: A config with no `root` reads the working directory, which is the member root when `pnpm run
test:coverage` runs there.
- **EC-03**: A member's documented override lowers one threshold and keeps the rest of its floor (a strict package
  that lowers branches to 75 keeps lines and functions at 90).
- **EC-04**: `stackra test --coverage --tier int` (or `e2e`) is a usage error (exit 2): coverage measures the unit tier.
- **EC-05**: With `--affected`, the `coverage` phase filters turbo to the affected members and their dependents.
- **EC-06**: Without turbo installed, the `coverage` phase reports `skipped (not installed)`.
- **EC-07**: `@stackra/tenancy`'s Postgres-only drivers, `TenantDataKeyService` and migrations run only in the int tier,
  so its unit coverage excludes them with that reason in its `vitest.config.ts`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `@stackra/vitest-config/coverage` entry SHALL export `STRICT_COVERAGE_PACKAGES` (every
  `packages/security` package plus actions, outbox, workflow, versioning and validation), `STRICT_COVERAGE_THRESHOLDS`
  (90/90/80) and `coverageThresholdsFor(name)`.
- **FR-002**: WHEN `withCoverage` wraps a config THE wrapper SHALL read the member's name from `<root>/package.json`
  (the config's `root`, else the working directory) and set the thresholds to `coverageThresholdsFor(name)`, with the
  member's documented overrides applied last.
- **FR-003**: THE root `test:coverage` script SHALL run over packages and services, and every member with a unit tier
  (except the five tooling presets) SHALL define `test:coverage`.
- **FR-004**: THE root SHALL define `verify:box` as `pnpm verify && pnpm test:int && pnpm test:coverage`, and the
  testbed fallback's `verify` preset SHALL run it.
- **FR-005**: WHEN `stackra check` runs with `--with-tests` (or `--only coverage`) THE CLI SHALL run a `coverage`
  phase after `test`: `turbo run test:coverage --continue`, filtered to the affected members with `--affected`, one
  `failed` finding per failed task, ADR `0182`.
- **FR-006**: WHEN `stackra test --coverage` runs in a member THE CLI SHALL run the unit tier with `--coverage`; at the
  workspace root it SHALL run `turbo run test:coverage`; with another tier it SHALL refuse as a usage error.
- **FR-007**: THE `stackra new service` scaffold SHALL write `"test:coverage": "stackra test --coverage"` and
  `@vitest/coverage-v8` (`catalog:quality`).
- **FR-008**: THE members in the strict group and every other member on the branch SHALL meet their floor under
  `pnpm test:coverage` (tenancy's int-only half excluded with its reason; `@stackra/testing`'s e2e helpers tested).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a package in `STRICT_COVERAGE_PACKAGES` is wrapped by `withCoverage` THE wrapper SHALL set lines 90,
  functions 90 and branches 80.
- **AC-002**: WHEN any other member is wrapped THE wrapper SHALL set 80/80/70.
- **AC-003**: WHEN `pnpm verify:box` runs THE root SHALL run `pnpm verify`, then `pnpm test:int`, then `pnpm
test:coverage`, stopping at the first failure.
- **AC-004**: WHEN `stackra check --with-tests` runs THE CLI SHALL run the `coverage` phase and report each member
  below its floor.
- **AC-005**: IF a package or service with a unit tier has no `test:coverage` THEN the repo test SHALL fail.
- **AC-006**: WHEN `stackra test --coverage` runs THE CLI SHALL measure the unit tier, and refuse another tier.

## Success Criteria _(mandatory)_

- **SC-001**: `packages/tooling/vitest/src/__tests__/coverage.test.ts` proves FR-001, FR-002, AC-001, AC-002, EC-01 to
  EC-03, and fails when `withCoverage` stops reading the member's floor — verified by: unit
- **SC-002**: `tools/scripts/__tests__/coverage-gate.test.mjs` proves FR-003, FR-004, AC-003, AC-005 — verified by:
  unit (in `pnpm validate`)
- **SC-003**: the cli tests (`check-phases.constant.test.ts`, `parse-check-options.function.test.ts`,
  `resolve-tool.function.test.ts`, `tool-command.function.test.ts`, `service-template.function.test.ts`) prove FR-005
  to FR-007, AC-004, AC-006, EC-04 to EC-06 — verified by: unit
- **SC-004**: `turbo run test:coverage` passes for `@stackra/tenancy`, `@stackra/testing`, `@stackra/cli` and
  `@stackra/vitest-config` on a Linux box — verified by: manual

## Compatibility and migration

- A member outside the strict group sees no change.
- A strict-group package between 80% and 90% now fails `test:coverage`; it adds tests, or lowers one threshold in its
  own `vitest.config.ts` with the reason (the change policy of `@stackra/vitest-config/coverage`).
- A product service made before this change has no `test:coverage`; `stackra new service --over` writes nothing into
  an existing `package.json`, so the product adds `"test:coverage": "stackra test --coverage"` and
  `@vitest/coverage-v8` by hand.
- `pnpm verify` is unchanged; `pnpm verify:box` is the heavier run for the box and the tester lane.

## Risks

- **R-1**: The int tier needs Docker, so `verify:box` cannot run on a machine without it; the box and the
  GitHub-hosted fallback have it.
- **R-2**: PGlite suites are slow under coverage on a busy box; two suites got explicit timeouts. Another slow suite
  may need the same.
- **R-3**: Excluding tenancy's int-only files from unit coverage relies on the int tier running; `verify:box` runs it.

## Out of scope

- Merging int-tier coverage into the unit report.
- A coverage gate for apps.
- A required GitHub check for coverage (GitHub CI runs no tests by owner decision STA-2083; the box runs them).

## Assumptions

- The member root is the working directory when turbo runs a member's `test:coverage` script.
- `@vitest/coverage-v8` stays in the `quality` catalog.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-229 session) · created from the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-229 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-229 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-229 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-229 session) · T001 to T010 committed on the branch
