---
description: "Tasks for STA-2058: bare #stackra/routes, derived route titles, list permission on resource routes"
---

# Tasks: bare #stackra/routes, derived route titles and the list permission on resource routes

**Input**: Design documents from `.agents/specs/sta-2058-routes-typed-refs/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [ ] T001 Merge origin/main into the branch and confirm the gen and navigation tests pass on ci-box before any edit, in `packages/developer/gen/package.json` — covers: SC-003, AC-001 — route: gen

## Phase 2: User Story 1 - An app names routes through typed refs (Priority: P1)

**Goal**: `import { RouteKey, Routes } from "#stackra/routes"` resolves in every app with routes.

**Independent Test**: emitRoutes over the web app IR fixture writes .stackra/gen/routes.ts; the golden fixture shows it.

- [ ] T002 [US1] Test first: the bare file, its keys across runtimes, type-only imports, composed routes and aliases, none for a non-app in `packages/developer/gen/src/core/functions/__tests__/emit-routes.function.test.ts` — covers: FR-001, P-001, EC-01, EC-02, EC-03, EC-05, AC-001 — route: tests — deps: T001
- [ ] T003 [US1] Write .stackra/gen/routes.ts with Routes and RouteKey in `packages/developer/gen/src/core/functions/emit-routes.function.ts` — covers: FR-001, P-001, AC-001 — route: gen — deps: T002
- [ ] T004 [US1] Give the golden web app a route, a page and an authored #stackra/routes import, add a @stackra/navigation stub, refresh and review the expected output in `packages/developer/gen/__golden__/app-clients/input/apps/web/src/routes/home/home.route.ts.golden` and `packages/developer/gen/__golden__/README.md` — covers: SC-002, AC-001 — route: gen — deps: T003

## Phase 3: User Story 2 - Menus show a route's title, never its raw key (Priority: P2)

**Goal**: an untitled route gets <module>::routes.<snake(stem)>.title, and menus show it.

**Independent Test**: unit tests of routeTitleKey, emitRoutes, uiRoutesOf, registerRoutes and resolveMenuItems.

- [ ] T005 [P] [US2] Test first, then write routeTitleKey in `packages/developer/gen/src/core/functions/__tests__/route-title-key.function.test.ts` and `packages/developer/gen/src/core/functions/route-title-key.function.ts` — covers: FR-002, P-002, AC-002 — route: gen — deps: T003
- [ ] T006 [US2] Rows carry title for an own route that writes none and pass a composed route's recorded title, with tests, in `packages/developer/gen/src/core/functions/emit-routes.function.ts` and `packages/developer/gen/src/core/functions/host-routes-of.function.ts` — covers: FR-003, FR-004, P-003, AC-002 — route: gen — deps: T005
- [ ] T007 [P] [US2] Record the derived title on a package route that writes none, with its test, in `packages/developer/gen/src/core/functions/ui-routes-of.function.ts` — covers: FR-004, P-003, AC-002 — route: gen — deps: T005
- [ ] T008 [P] [US2] registerRoutes keeps an entry's title in a new table and resolveMenuItems falls back to it, with tests, in `packages/experience/navigation/src/core/functions/register-routes.function.ts`, `packages/experience/navigation/src/core/constants/route-title-table.constant.ts` and `packages/experience/navigation/src/core/functions/resolve-menu-items.function.ts` — covers: FR-005, P-004, AC-002 — route: package — deps: T001

## Phase 4: User Story 3 - Navigation hides resources the viewer cannot list (Priority: P2)

**Goal**: Resources.<Model> carries the bound list action's recorded permission.

**Independent Test**: emitResources unit test over the loyalty service manifest.

- [ ] T009 [US3] Test first, then pass the list permission into resource(...) in `packages/developer/gen/src/core/functions/__tests__/emit-resources.function.test.ts` and `packages/developer/gen/src/core/functions/emit-resources.function.ts` — covers: FR-006, P-005, EC-04, AC-003 — route: gen — deps: T001

## Phase 5: Polish

- [ ] T010 [P] Update the emitRoutes row and the `#stackra/resources` paragraph, and registering routes with a title, in `packages/developer/gen/README.md` and `packages/experience/navigation/README.md` — covers: SC-001, AC-001, AC-002, AC-003 — route: steward-docs — deps: T006, T009
- [ ] T011 Run gen and navigation test, typecheck, lint and pnpm verify on ci-box, and a changeset for both packages, in `.changeset/sta-2058-routes-typed-refs.md` — covers: SC-001, SC-003, AC-001, AC-002, AC-003 — route: verify-fix — deps: T004, T006, T007, T008, T009, T010
