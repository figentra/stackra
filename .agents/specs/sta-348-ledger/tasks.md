# Tasks: `@stackra/ledger` wave 5

**Input**: `.agents/specs/sta-348-ledger/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-ledger/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/commerce/ledger` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US5] `@Journaled`, `JournaledOptions` and `journalOf` in `packages/commerce/ledger/src/core/` — covers: FR-007, P-007 — route: package — deps: T002
- [x] T004 [US1] `Journal` with `balance`, `find` and `append`, and the entry types, in `packages/commerce/ledger/src/core/` — covers: FR-002, P-002, FR-003, P-003, FR-004, P-004, FR-008, P-008 — route: package — deps: T003
- [x] T005 [US3] `Journal#reverseWhere` with the floor cut — covers: FR-005, P-005 — route: package — deps: T004
- [x] T006 [US4] `Journal#post` and `UnbalancedPostingError` — covers: FR-006, P-006 — route: package — deps: T004
- [x] T007 [US2] Tests for every public symbol and the barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T006
- [x] T008 [US1] Changeset `.changeset/ledger-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T007
- [ ] T009 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install, with a Postgres integration test — covers: SC-002, SC-003 — route: tests — deps: T008
