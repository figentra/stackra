# Tasks: `@stackra/app` wave 3

**Input**: `.agents/specs/sta-348-app/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-app/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/app` — covers: FR-001 — route: package — deps: T001
- [x] T003 `bootApp`, `AppWiring`, `AppSections`, `envSecrets`, `messagesOf`, `ConsoleErrorReporterDriver` in `src/core/` — covers: FR-003, FR-004 — route: package — deps: T002
- [x] T004 [US1] [US7] Server `createApp`, `ServerApp`, `AppDrainingError`, `Controller` in `src/server/` — covers: FR-002, FR-005 — route: package — deps: T003
- [x] T005 [US2] Worker `createApp`, `WorkerRequest` in `src/worker/` — covers: FR-002 — route: package — deps: T003
- [x] T006 [US6] `Contexts`, `registerContext`, the built-in `i18n` context in `src/react/contexts/` — covers: FR-004 — route: package — deps: T003
- [x] T007 [US3] Browser `createApp`, `hydrateRoute` in `src/browser/` — covers: FR-002 — route: package — deps: T006
- [x] T008 [US4] Native `createApp` in `src/native/` — covers: FR-002 — route: package — deps: T006
- [x] T009 [US5] Electron `createApp`, `bundleFileUrl`, `BRIDGE_CHANNEL` in `src/electron/` — covers: FR-002 — route: package — deps: T003
- [x] T010 Stand-in barrels for the seven entries — covers: FR-001, FR-006 — route: package — deps: T004 to T009
- [x] T011 Tests beside every subject and the barrel tests — covers: SC-002 — route: tests — deps: T010
- [x] T012 Changeset `.changeset/app-package.md` — covers: SC-001 — route: package — deps: T010
- [ ] T013 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T011
