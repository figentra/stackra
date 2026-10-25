# Tasks: `@stackra/panel` wave 8

**Input**: `.agents/specs/sta-348-panel/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-panel/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/experience/panel` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `Resource`, the builder types and records, the data constructors and `describeResource` in `packages/experience/panel/src/core/` — covers: FR-002, P-002, FR-006, P-006 — route: package — deps: T002
- [x] T004 [US2] `Widget`, `Widget.place`, the display builder, `PlacementLayer`, `resolvePlacements` and `describeWidget` in `packages/experience/panel/src/core/` — covers: FR-003, P-003, FR-007, P-007 — route: package — deps: T002
- [x] T005 [US1] `Document`, `Panel`, `Blocks`, `slots`, `panels`, `resource` and `document` in `packages/experience/panel/src/core/` — covers: FR-004, P-004, FR-006, P-006 — route: package — deps: T002
- [x] T006 [US3] `CountMetric`, `MoneyMetric`, `TimeRangeInput` and their shipped schemas in `packages/experience/panel/src/core/` — covers: FR-005, P-005 — route: package — deps: T002
- [x] T007 [US4] `widget`, `registerWidgets`, `PanelShell`, the breadcrumbs, `Dashboard`, `WidgetTile` and `useActionRunner` in `packages/experience/panel/src/react/`, with the lang catalogues in `packages/experience/panel/assets/lang/` — covers: FR-008, P-008, FR-009, P-009, FR-010, P-010 — route: package — deps: T004
- [x] T008 [US4] `WidgetSlot` in `packages/experience/panel/src/native/` — covers: FR-008, P-008 — route: package — deps: T007
- [x] T009 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/`, and the naming and vocabulary checks — covers: SC-002, FR-011, P-011 — route: tests — deps: T008
- [x] T010 [US1] Changeset `.changeset/panel-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T009
- [ ] T011 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T010
