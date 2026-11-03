---
description: "Tasks for STA-2062: migration order by module and macro edges, the import check, the merged Blueprint"
---

# Tasks: gen orders migrations by module dependency and macro use, checks their imports, and merges own macros into Blueprint

**Input**: Design documents from `.agents/specs/sta-2062-migration-order-and-imports/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Setup

- [ ] T001 Add the optional `needs` field to `packages/developer/gen/src/core/types/migration-unit.type.ts` — covers: FR-001, AC-001 — route: spec-task

## Phase 2: User Story 1 - Migrations apply in dependency order (Priority: P1)

**Goal**: module and macro edges order the migrations.

**Independent Test**: ai's units follow tenancy's; an own module follows the sibling it depends on.

- [ ] T002 [US1] Tests for needs edges, a missing module, an own-module need and an unchanged tie in `packages/developer/gen/src/core/functions/__tests__/order-migrations.function.test.ts` — covers: FR-001, FR-006, P-001, P-005, EC-01, EC-03, AC-001 — route: tests — deps: T001
- [ ] T003 [US1] Edges from `needs` to each needed module's last migration in `packages/developer/gen/src/core/functions/order-migrations.function.ts` — covers: FR-001, FR-006, P-001, AC-001 — route: spec-task — deps: T002
- [ ] T004 [US1] Extract `moduleDependsOn` with its test into `packages/developer/gen/src/core/functions/module-depends-on.function.ts` and use it in `packages/developer/gen/src/core/functions/build-manifest.function.ts` and `packages/developer/gen/src/core/functions/emit-wiring.function.ts` — covers: FR-003, AC-001 — route: spec-task — deps: T001
- [ ] T005 [US1] Module needs and recorded macro owners in `packages/developer/gen/src/node/functions/compile-migrations.function.ts` — covers: FR-002, FR-003, P-002, EC-02, AC-001, AC-002 — route: spec-task — deps: T003, T004
- [ ] T006 [US1] Hermetic fixture test (fake database, tenancy and ai packages): tenancy before ai, own module order in `packages/developer/gen/src/node/functions/__tests__/compile-migrations.function.test.ts` — covers: FR-002, FR-003, P-002, AC-002 — route: tests — deps: T005

## Phase 3: User Story 2 - A migration that imports anything else is refused (Priority: P1)

**Goal**: `migration_import_forbidden` before load.

**Independent Test**: a fixture migration importing a model is refused and not loaded.

- [ ] T007 [US2] Import check with `typescript6` `preProcessFile` before load in `packages/developer/gen/src/node/functions/compile-migrations.function.ts` — covers: FR-004, P-003, EC-04, EC-05, AC-003 — route: spec-task — deps: T005
- [ ] T008 [US2] Cases for a value, a type-only, a dynamic import and a package migration in `packages/developer/gen/src/node/functions/__tests__/compile-migrations.function.test.ts` — covers: FR-004, P-003, AC-003 — route: tests — deps: T006, T007

## Phase 4: User Story 3 - A service's own macro type-checks (Priority: P1)

**Goal**: `.stackra/gen/blueprint.ts` for own macros.

**Independent Test**: a TypeScript program accepts the right macro call and rejects a wrong one.

- [ ] T009 [US3] `emitBlueprintMacros` and its test in `packages/developer/gen/src/core/functions/emit-blueprint-macros.function.ts` — covers: FR-005, P-004, AC-004 — route: spec-task — deps: T001
- [ ] T010 [US3] Return the blueprint file for a service in `packages/developer/gen/src/node/functions/compile-migrations.function.ts` — covers: FR-005, AC-004 — route: spec-task — deps: T007, T009
- [ ] T011 [US3] Type-check case over the fixture in `packages/developer/gen/src/node/functions/__tests__/compile-migrations.function.test.ts` — covers: FR-005, P-004, SC-003, AC-004 — route: tests — deps: T008, T010

## Phase 5: Polish

- [ ] T012 [P] README rows for `.stackra/migrations` and `.stackra/gen/blueprint.ts` in `packages/developer/gen/README.md` — covers: SC-001, AC-004 — route: steward-docs — deps: T011
- [ ] T013 [P] Gen patch changeset in `.changeset/sta-2062-migration-order-and-imports.md` — covers: SC-004, AC-001 — route: steward-changesets — deps: T011
- [ ] T014 `pnpm verify` on ci-box for `packages/developer/gen` — covers: SC-004, AC-001, AC-002, AC-003, AC-004 — route: verify-fix — deps: T012, T013
