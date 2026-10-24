# Tasks: `@stackra/container` wave 1b

**Input**: `.agents/specs/sta-348-container/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-container/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/foundation/container` — covers: FR-001, FR-007 — route: package — deps: T001
- [x] T003 [US1] Kind registry, `registerKind`, `kindOf`, `createKind`, `WithPartner` — covers: FR-006, SC-003 — route: package — deps: T002
- [x] T004 [US1] `Module`, `Service`, `Explorer`, `Driver(Port)` — covers: FR-002 — route: package — deps: T003
- [x] T005 [US3] `createDecorator`, `DecoratorTarget`, `Lifetime`, `Replaces` — covers: FR-002 — route: package — deps: T003
- [x] T006 [US2] `Container`, `DiscoveryService`, `UnresolvedPortError`, `named`, `Named`, `DriverName`, `DriverRegistry`, `Wiring` types — covers: FR-002, FR-005 — route: package — deps: T004, T005
- [x] T007 `./react` `ContainerProvider`, `useContainer` — covers: FR-003 — route: package — deps: T006
- [x] T008 [US4] `./testing` builder, app, `registerWiring`, `registerTestingPlugin` — covers: FR-003 — route: package — deps: T006
- [x] T009 Stand-in barrels for the three entries — covers: FR-001, FR-004 — route: package — deps: T007, T008
- [x] T010 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/container-package.md` — covers: SC-001 — route: package — deps: T009
- [ ] T012 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
