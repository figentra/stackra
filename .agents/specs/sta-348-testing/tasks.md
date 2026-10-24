# Tasks: `@stackra/testing`, the generic test kit (`.` entry)

**Input**: `.agents/specs/sta-348-testing/`

## Phase 1: Member

- [x] T001 [US1] Member files in `packages/developer/testing` (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, `tsdown.config.ts`, `vitest.config.ts`, README, AGENTS, LICENSE, CHANGELOG) — covers: FR-001, FR-008, SC-003 — route: spec-task

## Phase 2: The kit

- [x] T002 [US1] `src/core/index.ts` stand-in barrel with the vitest re-exports — covers: FR-001 — route: spec-task — deps: T001
- [x] T003 [US1] `freezeClock`, `freezeIds` and the internal `restoreAfterTest` in `src/core/functions/` — covers: FR-003, FR-004, EC-01 — route: spec-task — deps: T001
- [x] T004 [US2] `Fake` in `src/core/fake.fake.ts` with `FakeConstructor` and `FakeRecorder` in `src/core/types/` — covers: FR-005, EC-02 — route: spec-task — deps: T001
- [x] T005 [US2] `createMatcher` and `Matchers` — covers: FR-006 — route: spec-task — deps: T001
- [x] T006 [US2] `factory`, `FactoryDefaults`, `FixtureBuilder` — covers: FR-007, EC-03 — route: spec-task — deps: T001

## Phase 3: Tests (written, run later by the testing workflow)

- [x] T007 [US1] `src/__tests__/mock-hoisting.test.ts` and `src/__tests__/package-boundary.test.ts` — covers: FR-002, FR-008 — route: tests — deps: T002
- [x] T008 [US1] Tests beside every subject in `src/core/**/__tests__/` — covers: FR-001, FR-003 to FR-007, SC-002 — route: tests — deps: T002 to T006
- [ ] T009 Run the suite and the gate in the testing workflow; if FR-002 fails, stop and go to the owner — covers: FR-002, SC-002 — route: tests — deps: T007, T008

## Phase 4: Release

- [x] T010 Changeset `.changeset/testing-package.md` — covers: SC-001 — route: spec-task — deps: T008
