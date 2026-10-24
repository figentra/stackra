# Tasks: `@stackra/validation` wave 1c

**Input**: `.agents/specs/sta-348-validation/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-validation/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/foundation/validation` — covers: FR-001, FR-007 — route: package — deps: T001
- [x] T003 [US2] `Schema`, the registry, `registerSchemas`, `schemaOf`, `validate` — covers: FR-003, FR-005 — route: package — deps: T002
- [x] T004 [US1] Field decorators, `SHAPE_KINDS`, `IDENTITY_KINDS`, `FieldDecorator` — covers: FR-004 — route: package — deps: T003
- [x] T005 [US3] `CursorInput`, `TableInput`, `Page.of` — covers: SC-001 — route: package — deps: T004
- [x] T006 [US4] `PickType`, `OmitType`, `PartialType`, `ShapeClass` — covers: SC-001 — route: package — deps: T003
- [x] T007 [US5] `publicId`, `isoDateTime`, `json`, `url`, `duration`, `tableInput`, `Assert`, `Fields`, `Same` — covers: FR-006 — route: package — deps: T002
- [x] T008 Stand-in barrel `packages/foundation/validation/src/core/index.ts` — covers: FR-002 — route: package — deps: T005, T006, T007
- [x] T009 Tests beside every subject and the barrel test — covers: SC-002, SC-003, FR-008 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/validation-package.md` — covers: SC-001 — route: package — deps: T008
- [ ] T011 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009
