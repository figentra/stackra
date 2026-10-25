# Tasks: `@stackra/query` wave 4

**Input**: `.agents/specs/sta-348-query/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-query/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/state/query` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `QueryPersister`, `QueueLeader`, `MutationSender` and `ReplayOutcome` in `packages/state/query/src/contracts`, with `QueryPersisterName` and `QueueLeaderName` in `packages/state/query/src/core/types` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] `QueryScope`, `QueryOptions`, the shipped schema and `QueryConfig` in `packages/state/query/src/core` and `packages/state/query/src/config` — covers: FR-003, FR-008, P-003 — route: package — deps: T003
- [x] T005 [US2] `offlineMap`, `OfflineEntry`, `OfflineMap`, `OfflineActionRef` and `OfflineError` in `packages/state/query/src/core` — covers: FR-002, FR-005 — route: package — deps: T004
- [x] T006 [US1] `MutationQueue`, `PendingMutation`, `ConflictRecord`, `QueryPartition` and `StorageQueryPersisterDriver` in `packages/state/query/src/core` — covers: FR-004, FR-005, FR-008, P-004, P-005 — route: package — deps: T005
- [x] T007 [US3] `ServerStateCache` and `LiveQueryRef` in `packages/state/query/src/core` — covers: FR-006, FR-007, P-006, P-007 — route: package — deps: T006
- [x] T008 [US4] `useMutationQueue` in `packages/state/query/src/react`; `QueueFake`, `fakeQueue` and `FakeQueueOptions` in `packages/state/query/src/testing` — covers: FR-002 — route: package — deps: T006
- [x] T009 Stand-in barrels for the four entries — covers: FR-001, FR-002, P-002 — route: package — deps: T008
- [x] T010 Tests beside every subject and each barrel's test — covers: SC-002, P-002, P-008 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/query-package.md`; `oxfmt`, `oxlint` and `validate-repository.mjs` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 Pin `@tanstack/query-core` in a catalog, `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
