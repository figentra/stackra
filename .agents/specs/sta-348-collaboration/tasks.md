# Tasks: `@stackra/collaboration` wave 4

**Input**: `.agents/specs/sta-348-collaboration/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-collaboration/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/experience/collaboration` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] [US3] The three ports and their types in `packages/experience/collaboration/src/contracts` — covers: FR-003, P-003 — route: package — deps: T002
- [x] T004 [US2] `CollaborationOptions`, the shipped schema and `CollaborationConfig` in `packages/experience/collaboration/src/core` and `packages/experience/collaboration/src/config` — covers: FR-002 — route: package — deps: T003
- [x] T005 [US1] [US2] `LiveCollaborationEntitlement` and `CollaborationSession` in `packages/experience/collaboration/src/core` — covers: FR-004, FR-005, P-004, P-005 — route: package — deps: T004
- [x] T006 [US3] `SnapshotService` in `packages/experience/collaboration/src/core` — covers: FR-006, P-006 — route: package — deps: T004
- [x] T007 [US1] [US2] [US3] `usePresence`, `useCursors`, `useSharedDocument` and `yjsReplica` in `packages/experience/collaboration/src/react` — covers: FR-003, FR-004, FR-006 — route: package — deps: T005, T006
- [x] T008 [US4] The three memory drivers in `packages/experience/collaboration/src/testing` — covers: FR-003 — route: package — deps: T003
- [x] T009 Stand-in barrels for the four entries — covers: FR-001, FR-002, FR-003, P-002, P-003 — route: package — deps: T007, T008
- [x] T010 Tests beside every subject and each barrel's test — covers: SC-002, P-002, P-004, P-005, P-006 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/collaboration-package.md`; `oxfmt`, `oxlint` and `validate-repository.mjs` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 Pin `yjs` 13.6.33 in the default catalog, `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T010
