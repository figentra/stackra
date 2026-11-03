---
description: "Tasks for STA-2061: the seed entry registers factory partners, hosts package seeders and runs in module order"
---

# Tasks: the seed entry registers factory partners, hosts package seeders and runs in module order

**Input**: Design documents from `.agents/specs/sta-2061-seed-entry/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [x] T001 Move the module topological sort out of `emitWiring` into `packages/developer/gen/src/core/functions/topological.function.ts` and the own-module edges into `packages/developer/gen/src/core/functions/module-edges.function.ts`, and import both in `packages/developer/gen/src/core/functions/emit-wiring.function.ts` with its output unchanged — covers: FR-009, P-007, AC-004 — route: gen

## Phase 2: Foundational

- [x] T002 [P] Test the moved sort (order, ties, a cycle keeping source order) in `packages/developer/gen/src/core/functions/__tests__/topological.function.test.ts` — covers: FR-009, EC-05, AC-004 — route: tests — deps: T001
- [x] T003 [P] Test own seeders in module order against path order, ties by file, key and profile derived, in `packages/developer/gen/src/core/functions/__tests__/seeders-of.function.test.ts` — covers: FR-002, FR-006, P-004, AC-004 — route: tests — deps: T001
- [x] T004 Write `seedersOf` in `packages/developer/gen/src/core/functions/seeders-of.function.ts` — covers: FR-002, FR-006, P-004, AC-004 — route: gen — deps: T003

## Phase 3: User Story 1 - A seeder that uses a factory runs under stackra db seed (Priority: P1)

**Goal**: the seed entry registers the service's own factory pairs before the seeders run.

**Independent Test**: emit the seed entry of a service IR with a factory and a demo seeder; it calls
`registerModelPartners([[OrderFactory, Order]])` before `runSeedEntry`.

- [x] T005 [US1] Test own factory pairs in the seed entry, and no call without factories, in `packages/developer/gen/src/core/functions/__tests__/emit-runtime-entries.function.test.ts` — covers: FR-001, P-001, EC-06, AC-001 — route: tests — deps: T004
- [x] T006 [US1] Register own factory pairs and list own seeders through `seedersOf` in `packages/developer/gen/src/core/functions/emit-runtime-entries.function.ts` — covers: FR-001, FR-006, P-001, AC-001 — route: gen — deps: T005
- [ ] T007 [US1] Add `OrderFactory` and `ShopDemoSeeder` to the golden `service` fixture under `packages/developer/gen/__golden__/service/input/services/shop/src/node/database/` and refresh `packages/developer/gen/__golden__/service/expected/` on ci-box, checking every other fixture's wiring is unchanged — covers: FR-001, SC-001, SC-003, P-007, AC-002 — route: gen — deps: T006

## Phase 4: User Story 2 - Hosted package seeders run, in module-dependency order (Priority: P1)

**Goal**: a package's seeders and factory pairs reach its host's seed entry, in module-dependency order.

**Independent Test**: emit the seed entry of a service IR whose dependency manifest records a seeder and a factory; the
entry imports both from `<package>/testing`, registers the pair and lists the hosted seeder first.

- [x] T008 [US2] Test the `seeders` and `factories` sections, and their absence, in `packages/developer/gen/src/core/functions/__tests__/build-manifest.function.test.ts` — covers: FR-002, FR-003, P-002, AC-005 — route: tests — deps: T004
- [x] T009 [US2] Record the `seeders` and `factories` sections in `packages/developer/gen/src/core/functions/build-manifest.function.ts` — covers: FR-002, FR-003, P-002, AC-005 — route: gen — deps: T008
- [x] T010 [US2] Test hosted seeders and factories from `<package>/testing`, hosted-first and dependency order, a hosted-only service, an app dependency ignored and a clashing name aliased, in `packages/developer/gen/src/core/functions/__tests__/emit-runtime-entries.function.test.ts` — covers: FR-004, FR-005, FR-006, FR-007, FR-008, P-003, P-004, P-005, P-006, EC-01, EC-02, EC-03, EC-04, EC-07, AC-003, AC-004 — route: tests — deps: T006, T009
- [x] T011 [US2] Add hosted rows, hosted pairs, the dependency order, the hosted-only trigger and the alias to `packages/developer/gen/src/core/functions/emit-runtime-entries.function.ts` — covers: FR-004, FR-005, FR-006, FR-007, FR-008, P-003, P-005, P-006, AC-003 — route: gen — deps: T010
- [x] T012 [US2] Regenerate `packages/commerce/loyalty-kit/stackra.manifest.json` and `packages/security/access-log/stackra.manifest.json` with `stackra gen --manifests` on ci-box, then run `stackra gen --check` over the repo — covers: FR-002, FR-003, SC-004, AC-005 — route: codegen-drift — deps: T009

## Phase 5: Polish

- [x] T013 [P] Name the `seeders` and `factories` sections and the seed entry's pairs and hosted seeders in `packages/developer/gen/README.md` — covers: SC-001, AC-003 — route: steward-docs — deps: T011
- [x] T014 [P] Add a changeset for `@stackra/gen` in `.changeset/sta-2061-seed-entry.md` — covers: SC-004, AC-005 — route: steward-changesets — deps: T011
- [ ] T015 Run the gen package's gate (format, lint, typecheck, test, build) and `stackra gen --check` on ci-box for `packages/developer/gen` — covers: SC-002, SC-004, AC-001, AC-003 — route: verify-fix — deps: T007, T012, T013, T014
