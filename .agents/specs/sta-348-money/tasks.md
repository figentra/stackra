# Tasks: `@stackra/money` wave 1b

**Input**: `.agents/specs/sta-348-money/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-money/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/commerce/money` — covers: FR-001, FR-009 — route: package — deps: T001
- [x] T003 [US1] `CURRENCIES` and `CurrencyCode` — covers: FR-003 — route: package — deps: T002
- [x] T004 [US2] `Rounding` — covers: FR-007 — route: package — deps: T002
- [x] T005 [US1] [US2] [US3] `Money` — covers: FR-004, FR-005, FR-006, P-001, P-002 — route: package — deps: T003, T004
- [x] T006 [US4] `currencyCode()` and `money()` — covers: FR-008, P-003 — route: package — deps: T005
- [x] T007 Stand-in barrel `packages/commerce/money/src/core/index.ts` — covers: FR-002 — route: package — deps: T006
- [x] T008 Tests beside every subject and the barrel test — covers: SC-002, SC-003, FR-010 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/money-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T008
