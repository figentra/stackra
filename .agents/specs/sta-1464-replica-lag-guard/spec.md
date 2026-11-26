# Feature Specification: replica reads by declaration, set by configuration, with a lag guard

**Feature Branch**: `figentra/sta-1464-replica-lag-guard`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (pending)

**Linear**: STA-1464

**Clarifications status**: complete

**Input**: data-layer gap sc11 (stackra-307). STA-1504 landed `reads: "replica"` with a read-your-writes window, but a
replica query read whatever replica it got, however far behind, and only its code decided where it read. Production
needs a safe way to offload reads: a query declares the lag it tolerates, configuration can move a query to a replica or
back without a code change, and a replica lagging past what the read tolerates (or behind the caller's last write) is
skipped for the primary.

### Sources

- `packages/application/actions/src/contracts/ports/replica-reads.port.ts` (the port)
- `packages/application/actions/src/core/services/action-pipeline.service.ts` (`routed`)
- `packages/data/database/src/node/drivers/postgres-database.driver.ts` (`onReplica`)
- `packages/data/database/src/node/drivers/database-replica-reads.driver.ts`
- `packages/developer/gen/src/core/functions/replica-reads-ports.function.ts`, `emit-boot.function.ts`
- Postgres 18 `pg_is_in_recovery`, `pg_last_wal_receive_lsn`, `pg_last_wal_replay_lsn`,
  `pg_last_xact_replay_timestamp`

## Impact

- **Apps touched**: none
- **Services touched**: none (their generated boot and wiring change on the next gen)
- **Packages touched**: packages/application/actions, packages/data/database, packages/developer/gen
- **Public contract change**: yes, additive. `QueryOptions.maxLag`; `ReplicaReads.reads(query)` (defaults to the
  declaration) and `onReplica(work, visit?)`; new `ReplicaQuery` and `ReplicaVisit` types; `Database.onReplica(work,
freshness?)` with `ReplicaFreshness`; `DatabaseConfig.replicaReads` (`ReplicaReadsSettings`);
  `DatabaseOptions.replicaProbe`; the manifest records a query's `maxLag`
- **Cross-service events**: none
- **Tenancy and data**: none changed; a replica read still replays the running `app.*` settings, and a read sent to the
  primary runs in the running context
- **Security and privacy**: a caller-sent `lastWriteAt` may only keep reads on the primary, never move them off it (a
  past value demands nothing more, a future one keeps the primary)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0057 decision 6)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/application/actions/README.md`, `packages/application/actions/AGENTS.md`,
  `packages/data/database/README.md`, `packages/data/database/AGENTS.md`, `packages/developer/gen/README.md`
- **Lane**: full
- **Change risk**: R2 (read routing; the default places every query where it was, and a stale replica falls back to
  the primary, never to an error)

## Acceptance criteria

- **AC-001**: THE `Query({ maxLag })` option SHALL be recorded as a canonical duration, and a value that is not a
  duration SHALL be refused when the class is declared.
- **AC-002**: WHEN a query runs with `ReplicaReads` bound THE pipeline SHALL ask `ReplicaReads.reads` with the query's
  key, area, declaration and `maxLag`, and read the replica only when it answers `replica` and the caller's
  read-your-writes window is closed; an action SHALL never be asked.
- **AC-003**: WHEN the pipeline sends a query to a replica THE visit SHALL carry the query's key, area, declaration,
  `maxLag`, the writer, the call's time and the carried `lastWriteAt`.
- **AC-004**: THE `DatabaseReplicaReadsDriver` SHALL place a query by `replicaReads.queries[key]`, else
  `replicaReads.areas[area]`, else its declaration.
- **AC-005**: THE `DatabaseReplicaReadsDriver` SHALL demand the visit's `maxLag`, else `replicaReads.maxLag`, and the
  latest of the writer's remembered and carried write as `after`.
- **AC-006**: WHEN `Database.onReplica` is given a freshness and the replica it is about to use lags more than `maxLag`,
  or has not replayed through `after`, THE work SHALL run on the primary; a caught-up replica SHALL serve it; without a
  freshness the replica SHALL be read unmeasured.
- **AC-007**: THE lag reading SHALL be reused for `replicaProbe` and taken again once when it fails only because it aged.
- **AC-008**: THE `DatabaseConfig.replicaReads` defaults SHALL be a 5-second `maxLag`, a 1-second `probeEvery` and no
  overrides, and an unknown area or place SHALL be a config issue.
- **AC-009**: gen SHALL record a query's `maxLag` in the manifest, reach `ReplicaReads` for a service that declares
  `@stackra/database` and has a query, and pass `replicaReads.probeEvery` to `connect` as `replicaProbe`.

## Status history

- 2026-11-26 → Clarified (scope: declaration by configuration and the lag guard; infra replica provisioning stays with
  runway's `readReplica` reader, STA-2001 Runway plan PR 10/11)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built and tested on box 2, the lag guard proved on a real streaming standby)
