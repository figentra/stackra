# Tasks: `@stackra/database` wave 4

**Input**: `.agents/specs/sta-348-database/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-database/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/database` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Database`, `PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver` in `packages/data/database/src/core/ports/` and `packages/data/database/src/core/drivers/` — covers: FR-003, FR-006, P-006 — route: package — deps: T002
- [x] T004 [US1] `CrudService`, `repositoryOf`, `GraphQuery`, `MetricsReader`, `Aggregate`, `MixedCurrencyError` in `packages/data/database/src/core/` — covers: FR-002, FR-003, P-003 — route: package — deps: T003
- [x] T005 [US2] `Migration`, `Macro`, `Seeder`, `compileMigration` and the recorders in `packages/data/database/src/core/records/` — covers: FR-004, FR-005, P-004, P-005 — route: package — deps: T002
- [x] T006 [US1] `StackraNamingStrategy`, `table`, `sql`, `operationAction`, `operationQuery`, `registerEntities`, `registerModelPartners` in `packages/data/database/src/core/` — covers: FR-002, FR-005 — route: package — deps: T004
- [x] T007 [US3] `ScopeRef` in `packages/foundation/contracts/src/core/types/scope-ref.type.ts` — covers: FR-006 — route: package — deps: T002
- [x] T008 [US4] `Factory`, `Faker`, `usePostgres` and the testing plugin in `packages/data/database/src/testing/` — covers: FR-002, FR-007, P-007 — route: package — deps: T004
- [x] T009 [US1] Stand-in barrels `packages/data/database/src/core/index.ts` and `packages/data/database/src/testing/index.ts` with their export-list tests — covers: FR-002, P-002 — route: package — deps: T008
- [x] T010 [US3] Tests for every public symbol in `src/**/__tests__/`, with the Testcontainers isolation test — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/database-package.md`; `oxfmt`, `oxlint` and `tsc --noEmit` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's unit and integration tests and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
