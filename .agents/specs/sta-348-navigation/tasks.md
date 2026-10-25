# Tasks: `@stackra/navigation` wave 7

**Input**: `.agents/specs/sta-348-navigation/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-navigation/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/experience/navigation` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `Route`, `Layout`, `Menu`, their option and class types, the enums, `ChromeConfig`, `ChromeConfig$` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] `RouteContext`, `LayoutContext`, `MetaContext`, `RouteProps`, `InferParams` and the types they read — covers: FR-002 — route: package — deps: T003
- [x] T005 [US2] `routeRef`, `registerRoutes`, `resolveHref`, `fillPath`, `navigation`, `tabs`, `createMenuBuilder`, `resolveMenuItems` — covers: FR-002, FR-003 — route: package — deps: T003
- [x] T006 [US3] `RouteCaller`, `createRouteContext`, `readFormData`, `parseSearch`, `data`, `contributeRouteContext`, `registerDocumentResolver`, `loadRoute` — covers: FR-003, FR-004, FR-005 — route: package — deps: T004
- [x] T007 [US2] `./react` links and hooks: `Link`, `NavLink`, `useHref`, `useNavigate`, `useLocaleHref`, `useMenu`, `useNavigation`, `useLayoutData`, `useSubmit` — covers: FR-002, FR-003 — route: package — deps: T005, T006
- [x] T008 [US3] `./react` adapters: `RootErrorBoundary`, `toRoot`, `toLayout`, `toRoute`, `toPanel`, `toResource`, `toSettingsPage`, `registerRoutePages`, `routeAdapter`, `routeContext` — covers: FR-002, FR-003 — route: package — deps: T006
- [x] T009 [US3] `./native`: `toScreen`, `useLayoutLoader`, `useNavigate`, `useRouteReload`, `ContextMenu` — covers: FR-002, FR-003 — route: package — deps: T006
- [x] T010 [US4] `./testing`: `runLoader`, `registerRouteTestingPart`, `createRoutesStub` — covers: FR-002, FR-004 — route: package — deps: T006
- [x] T011 Stand-in barrels for the five entries — covers: FR-001, FR-002 — route: package — deps: T007, T008, T009, T010
- [x] T012 Tests beside every subject and each barrel's test — covers: SC-001, SC-002 — route: tests — deps: T011
- [x] T013 Changeset `.changeset/navigation-package.md` — covers: SC-001 — route: package — deps: T011
- [ ] T014 Owner: `pnpm install`, tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T012
