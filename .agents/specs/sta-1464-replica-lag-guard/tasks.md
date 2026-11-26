# Tasks: replica reads by declaration, set by configuration, with a lag guard

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-1464

- [x] T001 the `maxLag` option, the `ReplicaQuery` and `ReplicaVisit` types, the port's `reads` and visit, and the pipeline's routing, with their tests, in `packages/application/actions/src/core/bases/query.base.ts`, `packages/application/actions/src/core/types/query-options.type.ts`, `packages/application/actions/src/contracts/ports/replica-reads.port.ts`, `packages/application/actions/src/core/services/action-pipeline.service.ts` — covers: AC-001, AC-002, AC-003, P-001, P-002, P-003 — route: spec-task
- [x] T002 the `replicaReads` configuration, the freshness on `Database.onReplica` and the pure position functions, with their tests, in `packages/data/database/src/core/` — covers: AC-008, P-007, P-008 — route: spec-task — deps: T001
- [x] T003 the lag guard in `PostgresDatabaseDriver.onReplica` and the placement and demand in `DatabaseReplicaReadsDriver`, with the unit tests and the streaming-standby integration test, in `packages/data/database/src/node/drivers/` — covers: AC-004, AC-005, AC-006, AC-007, P-004, P-005, P-006 — route: spec-task — deps: T002
- [x] T004 gen's port reach, manifest `maxLag` and boot `replicaProbe`, with the tests and the golden files, in `packages/developer/gen/src/core/functions/` — covers: AC-009, P-009 — route: spec-task — deps: T003
- [x] T005 the docs and the changeset in the package READMEs and AGENTS.md and `.changeset/replica-reads-lag-guard.md` — covers: AC-001, AC-009 — route: spec-task — deps: T004
