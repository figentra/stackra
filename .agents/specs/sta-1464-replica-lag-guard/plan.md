# Implementation Plan: replica reads by declaration, set by configuration, with a lag guard

**Spec**: `.agents/specs/sta-1464-replica-lag-guard/spec.md` · **Linear**: STA-1464 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1464-replica-lag-guard/spec.md`

## Summary

The pipeline describes each query to `ReplicaReads` (`ReplicaQuery`) and lets the port place it (`reads`, the
declaration by default); a replica visit (`ReplicaVisit`) carries the query's `maxLag` and the caller's last write.
`DatabaseReplicaReadsDriver` places queries from `DatabaseConfig.replicaReads` and demands a `ReplicaFreshness` of
`Database.onReplica`, which `PostgresDatabaseDriver` enforces by measuring the replica connection it is about to use and
running the work on the primary when that replica is not fresh enough.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/application/actions`, `packages/data/database`, `packages/developer/gen`
- **Testing**: vitest unit tests in `src/**/__tests__/`, the gen golden files, and one `.int` test on a real Postgres
  streaming standby (Testcontainers)
- **Storage**: none new; one read-only statement on the replica per `probeEvery`
- **Runtime target**: node services

## Constitution Check

| Law                                   | Result | Note                                                     |
| ------------------------------------- | ------ | -------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | database already depends on actions/contracts            |
| Secrets (ADR 0009)                    | N/A    | none                                                     |
| Security                              | PASS   | a caller-sent last write only keeps reads on the primary |
| HTTP and events                       | N/A    | none                                                     |
| Tenancy                               | PASS   | the replica read still replays the `app.*` settings      |
| Delegation                            | PASS   | Claude only                                              |
| Not built yet (ADR 0011)              | PASS   | no stub; infra provisioning is runway's (STA-2001)       |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`, Docker test `.int`                |
| Versions and catalogs                 | PASS   | one minor changeset for the three packages               |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                        |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                |
| Docs and ADRs                         | PASS   | package READMEs and AGENTS.md; ADR 0057 decision 6 cited |

## Deploy modes

| Mode       | Behaviour                                                         |
| ---------- | ----------------------------------------------------------------- |
| SaaS       | replica reads where configured; a stale replica reads the primary |
| On-prem    | the same; no replica connected means every read is primary        |
| Air-gapped | the same; no outbound call added                                  |

## Correctness properties

- **P-001**: `maxLag` is a canonical duration or the declaration throws — Validates: AC-001
- **P-002**: only queries are placed, by the port's answer, outside the window — Validates: AC-002
- **P-003**: the visit equals the query description plus writer, time and carried write — Validates: AC-003
- **P-004**: key over area over declaration — Validates: AC-004
- **P-005**: the demanded freshness is the visit's `maxLag` or the configured one, `after` the latest write —
  Validates: AC-005
- **P-006**: a paused standby behind a write is skipped by a guarded read and served to an unguarded one; it serves
  again once caught up — Validates: AC-006
- **P-007**: `replicaIsFresh` and `replicaPositionOf` judge positions exactly at their bounds — Validates: AC-006,
  AC-007
- **P-008**: the schema defaults equal the options class and refuse bad values — Validates: AC-008
- **P-009**: gen's port reach, manifest and boot line — Validates: AC-009

## Architecture overview

`ActionPipeline.routed` (query only) → `ReplicaReads.reads(ReplicaQuery)` → `pinned(writer, at, lastWriteAt)` →
`ReplicaReads.onReplica(handle, ReplicaVisit)` → `DatabaseReplicaReadsDriver` → `Database.onReplica(work,
{ maxLag, after })` → `PostgresDatabaseDriver`: pick the replica connection, read its position (`REPLICA_POSITION_SQL`,
reused for `replicaProbe`), `replicaIsFresh`, then the replica's read-only transaction or the primary.

## Components and responsibilities

- `ReplicaReads` (port): `reads` places a query; `onReplica` takes the visit.
- `ActionPipeline.routed`: describes the query, asks, keeps the window, hands the visit.
- `DatabaseReplicaReadsDriver`: configuration overrides, default `maxLag`, `after` from the remembered and carried write.
- `PostgresDatabaseDriver.onReplica`: the lag guard on the connection it uses; `fresh` and `probe` (coalesced per
  connection).
- `replicaPositionOf`, `replicaIsFresh`: pure reading and judging.
- gen: `replicaReadsPorts`, `buildManifest` (`maxLag`), `emitBoot` (`replicaProbe`).

## Files and folders

```text
packages/application/actions/src/contracts/{index.ts,ports/replica-reads.port.ts,types/replica-query.type.ts,types/replica-visit.type.ts}
packages/application/actions/src/core/{bases/query.base.ts,types/query-options.type.ts,services/action-pipeline.service.ts}
packages/data/database/src/core/{constants,functions,types,ports,schemas}/… (replica-*)
packages/data/database/src/node/drivers/{postgres-database,database-replica-reads}.driver.ts
packages/data/database/src/node/drivers/__tests__/postgres-replica-lag.int.test.ts
packages/developer/gen/src/core/functions/{replica-reads-ports,build-manifest,emit-boot}.function.ts
packages/developer/gen/__golden__/*/expected/services/*/.stackra/gen/boot.ts.golden
.changeset/replica-reads-lag-guard.md
```

## Data models and migrations

none

## Contracts

Additive only (see the spec's Impact). Every existing call keeps its behaviour: `reads` defaults to the declaration,
`onReplica(work)` without a freshness reads the replica as before.

## Error handling

A replica that is not fresh sends the read to the primary, never to an error. A replica that refuses the probe or the
connection fails the read as `onReplica` did before.

## Security and tenancy

The replica path still replays the running `app.*` settings; the primary path runs in the running context. A forged
`lastWriteAt` can only keep a read on the primary.

## Testing strategy

- AC-001: `query.base.test.ts`.
- AC-002, AC-003: `action-pipeline.service.test.ts` (STA-1464 block).
- AC-004, AC-005: `database-replica-reads.driver.test.ts`.
- AC-006, AC-007: `postgres-replica-lag.int.test.ts` on a real standby (replay paused and resumed), and the pure
  function tests.
- AC-008: `database-config-options.schema.test.ts`.
- AC-009: `replica-reads-ports.function.test.ts`, `emit-boot.function.test.ts`, the golden files.

## Rollout

One minor changeset for `@stackra/actions`, `@stackra/database` and `@stackra/gen`. Services pick it up on their next
gen; nothing moves to a replica until a query declares it or configuration places it, and a replica url is connected.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0057 (decision 6: read replica), implemented; no new ADR.

## Docs

The package READMEs and AGENTS.md listed in the spec.

## Complexity tracking

none
