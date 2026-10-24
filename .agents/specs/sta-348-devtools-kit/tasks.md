# Tasks: `@stackra/devtools-kit`

**Input**: `.agents/specs/sta-348-devtools-kit/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-devtools-kit/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, ORIGIN) in `packages/developer/devtools-kit` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `DevtoolsError`, the constants and the types in `src/core/` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1, US2, US3] `DevtoolsKit` with the tab and RPC registries, the stream, the bus tap and the host session — covers: FR-002, FR-003, FR-004 — route: package — deps: T003
- [x] T005 [US1, US2, US3] Tests beside every public symbol (`__tests__/`) — covers: SC-002 — route: tests — deps: T004
- [x] T006 [US1] Changeset `.changeset/devtools-kit-package.md` — covers: SC-001 — route: package — deps: T004
- [ ] T007 [US1, US2, US3] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-003 — route: tests — deps: T005
