---
description: "Tasks for STA-2896: an environment's region is any provider region; me, eu and ksa stay as presets; create asks"
---

# Tasks: an environment's region is any provider region; me, eu and ksa stay as presets; create asks

**Input**: Design documents from `.agents/specs/sta-2896-runway-any-region/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - resolving a region

- [x] T001 `REGION_PRESETS` and `resolveRegion` in `packages/developer/runway/src/core/constants/region-presets.constant.ts` and `packages/developer/runway/src/core/functions/resolve-region.function.ts` — covers: FR-002, P-001, P-002 — route: spec-task
- [x] T002 `region` as a lower-case string in `packages/developer/runway/src/core/constants/root-environment-schema.constant.ts`, `tools/schemas/runway-root.schema.json` and `packages/developer/runway/schema/root.json` — covers: FR-001, SC-001 — route: spec-task
- [x] T003 tests in `packages/developer/runway/src/core/functions/__tests__/resolve-region.function.test.ts` — covers: FR-002, P-001, P-002 — route: tests — deps: T001

## Phase 2: User Story 1 - A team outside Figentra names its own region (Priority: P1)

**Goal**: the region checks follow the resolved cloud and location, with neutral messages.

**Independent Test**: `parse-runway-estate.function.test.ts`.

- [x] T004 [US1] the checks over `resolveRegion` in `packages/developer/runway/src/core/functions/check-environment-region.function.ts`, `packages/developer/runway/src/core/functions/unused-cloud-opt-ins.function.ts` and `packages/developer/runway/src/core/functions/deprecated-fields.function.ts` — covers: FR-003, FR-004, FR-005, FR-006, AC-001, AC-002, AC-003, AC-004 — route: spec-task — deps: T001
- [x] T005 [US1] tests in `packages/developer/runway/src/core/functions/__tests__/parse-runway-estate.function.test.ts` and `packages/developer/runway/src/core/__tests__/index.test.ts` — covers: FR-001, FR-003, FR-004, FR-005, FR-006, AC-001 to AC-004, SC-001 — route: tests — deps: T004
- [x] T006 [US1] the barrel exports in `packages/developer/runway/src/core/index.ts` — covers: FR-002 — route: spec-task — deps: T001

## Phase 3: User Story 2 - `stackra create` asks where the app runs (Priority: P1)

**Goal**: `--region` and the question place the new app's root runway.

**Independent Test**: `place-region.test.ts` and `create.command.test.ts`.

- [x] T007 [US2] `placeRegion`, `starterRegion` and `StarterRegion` in `packages/developer/cli/src/node/create/functions/place-region.function.ts`, `packages/developer/cli/src/node/create/functions/starter-region.function.ts` and `packages/developer/cli/src/node/create/types/starter-region.type.ts` — covers: FR-008, NFR-001, NFR-002, P-003 — route: spec-task — deps: T001
- [x] T008 [US2] `--region` and the question in `packages/developer/cli/src/node/commands/create.command.ts` — covers: FR-007, FR-009, AC-006, AC-007, P-004 — route: spec-task — deps: T007
- [x] T009 [US2] tests in `packages/developer/cli/src/node/create/functions/__tests__/place-region.test.ts` and `packages/developer/cli/src/node/commands/__tests__/create.command.test.ts` — covers: FR-007, FR-008, FR-009, AC-005, AC-006, AC-007, SC-002 — route: tests — deps: T008

## Phase 4: Polish

- [x] T010 [P] the ADR 0524 amendment (proposed), the validate page and the runway README in `apps/docs/src/docs/adr/0524-cloud-estate-aws-organization-and-gcp-projects.mdx`, `apps/docs/src/docs/runway/validate.mdx` and `packages/developer/runway/README.md` — covers: FR-003, FR-007 — route: steward-docs — deps: T004, T008
- [x] T011 [P] changesets for the runway and cli packages (`packages/developer/runway`, `packages/developer/cli`) in `.changeset/runway-any-provider-region.md` and `.changeset/create-asks-region.md` — covers: FR-001, FR-007 — route: steward-changesets — deps: T004, T008
