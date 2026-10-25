# Tasks: `@stackra/model` wave 3

**Input**: `.agents/specs/sta-348-model/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-model/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/model` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `Model`, `createTrait`, `traitsOf`, `mintPublicId` and the trait registry — covers: FR-003, FR-004 — route: package — deps: T002
- [x] T004 [US1] The model traits — covers: FR-002, FR-004 — route: package — deps: T003
- [x] T005 [US2] [US3] `OnDelete`, the relation decorators, `@Index`, `@Searchable` — covers: FR-002, FR-005 — route: package — deps: T003
- [x] T006 [US2] `Link`, `Translated` — covers: FR-002, FR-006 — route: package — deps: T002
- [x] T007 [US4] `LinkType`, `TranslatedType`, `MinorUnitsType`, `MoneySchema` — covers: FR-006, FR-007 — route: package — deps: T006
- [x] T008 [US5] `Attributes`, `RelationSource` — covers: FR-002 — route: package — deps: T006
- [x] T009 Stand-in barrel for `.` — covers: FR-002 — route: package — deps: T004, T005, T007, T008
- [x] T010 Tests beside every subject and the barrel test — covers: SC-002 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/model-package.md` — covers: SC-001 — route: package — deps: T009
- [ ] T012 Owner: add `@mikro-orm/core: 7.2.5` to the default catalog — covers: SC-003 — route: dependencies — deps: T002
- [ ] T013 `pnpm install` to link the member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T010, T012
- [x] T014 [US1] Reconciliation R4: remove `BelongsToTenant` (trait, barrel, tests, README, spec, changeset); tenancy's `./node` owns it — covers: FR-002, FR-004 — route: package — deps: T009
- [x] T015 [US6] `@Visibility` and `VisibilityOptions` in `packages/data/model/src/core/{decorators,types}/`, the barrel, its export test, the facet test, README, AGENTS and the changeset — covers: FR-005, FR-008, P-005, P-008 — route: package — deps: T009
