# Tasks: `@stackra/rules` wave 6

**Input**: `.agents/specs/sta-348-rules/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-rules/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG, lang catalogues) in `packages/application/rules` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Operator`, `FieldType` and the fact source types in `packages/application/rules/src/contracts/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `Rules`, `fitsOperand` and `ConditionInvalidError` in `packages/application/rules/src/core/` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T005 [US2] `evaluate` and the condition, fact and evaluation types — covers: FR-004, P-004, FR-008, P-008 — route: package — deps: T004
- [x] T006 [US3] `HasRevisions`, `Revision` and migration `0002` in `packages/data/content/src/node/` — covers: FR-006, P-006 — route: package — deps: T002
- [x] T007 [US3] `RuleSet`, its migration, `RuleSetService`, `RuleSetChangedError` and `RuleSetPublished` — covers: FR-005, P-005 — route: package — deps: T005, T006
- [x] T008 [US4] `RuleBuilder` with its editors in `packages/application/rules/src/react/` — covers: FR-007, P-007 — route: package — deps: T005
- [x] T009 [US2] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/rules-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's and content's tests, typecheck and build in the separate testing workflow after the integrator's install, with a Postgres integration test — covers: SC-002, SC-003 — route: tests — deps: T010
