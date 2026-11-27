---
description: "Tasks for STA-2876: public repos and packages carry nothing internal"
---

# Tasks: public repos and packages carry nothing internal

**Input**: Design documents from `.agents/specs/sta-2876-scrub-internal-content/`

**Prerequisites**: plan.md, spec.md

## Phase 1: User Story 1 - Nothing internal in what we publish (Priority: P1)

**Goal**: every tracked file outside the allow list reads clean.

**Independent Test**: `node tools/scripts/guard-public-content.mjs` exits 0.

- [x] T001 [US1] neutral examples in code, fixtures and tests across `packages/**` (outside `packages/developer/cli`), `apps/mobile`, `apps/playground` and `workers/registry` — covers: FR-001, FR-007, AC-001 — route: spec-task
- [x] T002 [US1] neutral prose in `apps/docs/src/docs/**`, `.agents/**` (never an approval line), `.github/workflows/apply-testbed.yml` and `pnpm-workspace.yaml` — covers: FR-001, FR-007, AC-001 — route: spec-task
- [x] T003 [US1] the demo theme's files renamed in `apps/mobile/src/constants/brand-themes/`, `apps/playground/src/constants/brand-themes/` and `apps/playground/public/fonts/` — covers: FR-001 — route: spec-task
- [x] T004 [US1] `guard-port.mjs` paths from `GUARD_PORT_STACKRA` and `GUARD_PORT_MUSLIN_REFERENCE` in `tools/scripts/guard-port.mjs` and `tools/scripts/__tests__/guard-port.test.mjs` — covers: FR-011 — route: spec-task
- [x] T005 [US1] `--extra-repos` in `tools/scripts/linear-reconcile.mjs`, `tools/scripts/linear-reconcile.repos.yaml`, `.github/workflows/linear-sync.yml` and `tools/scripts/__tests__/linear-reconcile.test.mjs` — covers: FR-010, AC-007 — route: spec-task

## Phase 2: User Story 3 - A product names its own preview zone (Priority: P2)

**Goal**: no default zone in `@stackra/runway`.

**Independent Test**: `publish-pull-request.function.test.ts`.

- [x] T006 [US3] `pullRequestZone` in `packages/developer/runway/src/core/constants/root-environment-schema.constant.ts`, `packages/developer/runway/schema/root.json` and `tools/schemas/runway-root.schema.json` — covers: FR-008, AC-005 — route: spec-task
- [x] T007 [US3] the zone as an input in `packages/developer/runway/src/node/functions/pull-request-preview-host.function.ts`, `publish-pull-request.function.ts` and `packages/developer/runway/src/node/constants/pull-request-preview-settings.constant.ts` — covers: FR-008, AC-005, P-005 — route: spec-task — deps: T006
- [x] T008 [US3] tests in `packages/developer/runway/src/node/functions/__tests__/publish-pull-request.function.test.ts` — covers: FR-008, AC-005 — route: tests — deps: T007

## Phase 3: The testbed's own names

- [x] T009 `keyPair` in `packages/infrastructure/infra-testbed/src/node/types/aws-testbed-options.type.ts`, `src/node/functions/aws-testbed.function.ts`, `src/core/constants/testbed-defaults.constant.ts`, `pulumi/main.mjs` and `.github/workflows/apply-testbed.yml`; the state bucket from the assumed account — covers: FR-009, AC-006, P-006 — route: spec-task
- [x] T010 test in `packages/infrastructure/infra-testbed/src/node/functions/__tests__/aws-testbed.function.test.ts` — covers: FR-009, AC-006 — route: tests — deps: T009

## Phase 4: User Story 2 - It stays that way (Priority: P1)

**Goal**: the guard, its test and the release steps.

**Independent Test**: `tools/scripts/__tests__/guard-public-content.test.mjs`.

- [x] T011 [US2] the guard and its allow list in `tools/scripts/guard-public-content.mjs` and `tools/scripts/public-content.allow.json` — covers: FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, P-001, P-002, P-003 — route: spec-task
- [x] T012 [US2] tests, including the whole repository, in `tools/scripts/__tests__/guard-public-content.test.mjs` — covers: FR-001 to FR-005, AC-001, AC-003, SC-002 — route: tests — deps: T011
- [x] T013 [US2] the tarball steps in `.github/workflows/runway-npm.yml` (input `pack-check`) and `.github/workflows/release.yml` (release and prerelease) — covers: FR-006, AC-002, AC-004, P-004, SC-001 — route: spec-task — deps: T011

## Phase 5: Polish

- [x] T014 [P] docs in `apps/docs/src/docs/runbooks/release.mdx`, `apps/docs/src/docs/runbooks/runway.mdx`, `.github/workflows/README.md`, `tools/scripts/README.md` and `packages/developer/runway/README.md` — covers: FR-006, FR-008 — route: steward-docs — deps: T013
- [x] T015 [P] changeset for the touched packages in `.changeset/public-content-scrub.md` — covers: FR-008, FR-009 — route: steward-changesets — deps: T007, T009
