# Tasks: `@stackra/content` wave 7

**Input**: `.agents/specs/sta-348-content/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-content/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/content` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `ContentEntryType` in `packages/data/content/src/core/enums/content-entry-type.enum.ts` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US2] `CustomFieldType`, the definition types, `checkCustomFieldDefinition` and `CustomFieldDefinitionInvalidError` in `packages/data/content/src/core/` — covers: FR-003, P-003 — route: package — deps: T002
- [x] T005 [US3] `checkCustomFields` and `CustomFieldsInvalidError` in `packages/data/content/src/core/` — covers: FR-004, P-004 — route: package — deps: T004
- [x] T006 [US2] [US3] `CustomField`, `CustomFieldValueSet`, the migration, `CustomFieldService` and `CustomFieldTakenError` in `packages/data/content/src/` — covers: FR-005, P-005 — route: package — deps: T005
- [x] T007 [US2] `HasCustomFields` and `CustomFieldLimitEntitlement` in `packages/data/content/src/node/` — covers: FR-006, P-006, FR-007, P-007 — route: package — deps: T006
- [x] T008 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/content-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T008
- [ ] T010 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T009
- [x] T011 [US2] [US3] `CustomFieldService` reads the call's scope through `RequestContext` when no `ScopeRef` is passed (the explicit argument stays); `@stackra/actions` dependency; tests, README, AGENTS — covers: FR-005, P-005 — route: package — deps: T006
