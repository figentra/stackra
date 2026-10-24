# Tasks: `@stackra/search` wave 5

**Input**: `.agents/specs/sta-348-search/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-search/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/search` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `SearchDriver` and its types in `packages/data/search/src/contracts/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `SearchConfig` in `packages/data/search/src/config/search.config.ts`, with `SearchOptions`, `SearchConfig$` and the driver names — covers: FR-003, P-003 — route: package — deps: T002
- [x] T005 [US4] `searchWordsOf` and `searchDocumentOf` in `packages/data/search/src/core/functions/` — covers: FR-005, P-005, FR-008, P-008 — route: package — deps: T003
- [x] T006 [US1] `Search`, `SearchIndex`, `MemorySearchDriver` and `SearchCursorInvalidError` in `packages/data/search/src/core/` — covers: FR-004, P-004 — route: package — deps: T004, T005
- [x] T007 [US3] `PostgresSearchDriver` and `TEXT_SEARCH_CONFIGS` in `packages/data/search/src/node/` — covers: FR-006, P-006 — route: package — deps: T005
- [x] T008 [US2] `SearchableMacro` and `CreateTextFunctionsMigration` in `packages/data/search/src/node/database/`, with `t.tsvector` in `packages/data/database/src/core/records/blueprint.record.ts` — covers: FR-007, P-007, FR-002, P-002 — route: package — deps: T003
- [x] T009 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/search-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T010
