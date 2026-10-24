# Tasks: `@stackra/ui-pro`, the remaining HeroUI Pro components

**Input**: `.agents/specs/sta-416-ui-pro-remaining/`

## Phase 1: Setup

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-416-ui-pro-remaining/spec.md` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Catalog pins for the optional Pro peers in `pnpm-workspace.yaml` and the members' `package.json` — covers: FR-001, FR-006 — route: package — deps: T001

## Phase 2: Components

- [x] T003 [US1] Charts, web and native, in `packages/design-system/ui-pro/src` — covers: FR-001, FR-006, P-001, EC-01 — route: package — deps: T002
- [x] T004 [US1] AI components in `packages/design-system/ui-pro/src/react` — covers: FR-002, P-001, EC-01 — route: package — deps: T002
- [x] T005 [US1] Form components, web and native, in `packages/design-system/ui-pro/src` — covers: FR-003, FR-010, P-001, EC-01 — route: package — deps: T002
- [x] T006 [US1] Navigation, overlay and layout components, web and native, in `packages/design-system/ui-pro/src` — covers: FR-004, FR-011, P-001, EC-01 — route: package — deps: T002
- [x] T007 [US1] Shared data display and feedback components, web and native, in `packages/design-system/ui-pro/src` — covers: FR-005, FR-008, P-001, EC-01 — route: package — deps: T002
- [x] T008 [US1] Web-only data display and feedback components in `packages/design-system/ui-pro/src/react` — covers: FR-005, P-001, EC-01 — route: package — deps: T002
- [x] T009 [US1] Native buttons and date and time components in `packages/design-system/ui-pro/src/native` — covers: FR-007, FR-009, P-001, EC-01 — route: package — deps: T002

## Phase 3: Review surfaces and gate

- [x] T010 [US2] Playground routes for the new web components in `apps/playground` — covers: FR-012, P-002, SC-002 — route: frontend — deps: T003, T004, T005, T006, T007, T008
- [x] T011 [US2] Mobile review screens for the new native components in `apps/mobile` — covers: FR-013, P-003 — route: mobile — deps: T003, T005, T006, T007, T009
- [x] T012 [US1] Barrels, README, AGENTS, ADR 0310 decision 12 and a full `pnpm verify` plus the playground e2e in `packages/design-system/ui-pro` — covers: SC-001 — route: package — deps: T010, T011
