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
- [x] T013 [US5] Per-device order in `MutationQueue` (`deviceId`, `sequence`, the version 2 queue and its upgrade), `DeviceOrder` and the `MutationSender` signature — covers: FR-009, P-009 — route: package — deps: T011
- [x] T014 [US5] Caps: the local `OfflineCap` with `amountField`, the accepted-call log persisted with the queue, and the pipeline's `OfflineCapReachedError` in place of this package's — covers: FR-010, P-010 — route: package — deps: T013
- [x] T015 [US6] `registerReplicas`, `ReplicaStore`, `ReplicaSource`, `ReplicaChanges`, `ReplicaRow`, `ReplicaOptions`, `ReplicaRef`, `ReplicaSnapshot` and `useReplica`; the cache in memory only — covers: FR-006, FR-011, P-006, P-011 — route: package — deps: T011
- [x] T016 [US7] `OfflineLock`, `OfflineSession`, `AcknowledgementReader` and `QuerySettings`; unlock on sign-in and a fresh countdown after a wipe — covers: FR-012, P-012 — route: package — deps: T013
- [x] T017 [US7] The sealed `storage` persister over `PayloadSeal`; `QueueFake` on the new queue; the `devices` and `settings` dependencies — covers: FR-013, P-013 — route: package — deps: T016
- [x] T018 [US5] Tests for the new symbols (lock, replica store, `registerReplicas`, `useReplica`, the queue's order and caps), the barrel lists, README, AGENTS and the changeset — covers: SC-001, SC-002 — route: tests — deps: T014, T015, T016, T017
- [ ] T019 [US5] Run the wave-9 tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T018
