# Feature Specification: a connection gate admits pool transactions by depth, so call isolation never stalls the pool

**Feature Branch**: `figentra/sta-1716-pool-sizing-call-isolation`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-1716

**Clarifications status**: complete

**Input**: ADR 0495 runs every call and background unit in a transaction-local isolation transaction. A call holds
that connection while a `requiresNew` store (the iam policy snapshot, the Postgres rate limit, the access log, a webhook
attempt) opens a second one. With as many concurrent calls as the pool has connections, every call held one connection
and waited for a second that never came; the `pg` pool waits without a limit, so the service hung. ADR 0495 left this
open as "pools are sized for isolation: STA-1716". Sizing the pool at twice the concurrency only moves the line, and
background chains (relay tick, delivery, inbox receipt, the listener call's store) nest deeper than two.

### Sources

- ADR 0495, consequences ("pools are sized for isolation: STA-1716")
- ADR 0473, decision 2 (the pool budget per service and `DATABASE_POOL_MAX`), and its note of 2026-11-26 added here
- `packages/data/database/src/core/functions/run-transaction.function.ts` (the `requiresNew` path, STA-2565)
- `packages/data/database/src/core/bases/crud-service.base.ts` (own-transaction writes with `REQUIRES_NEW`)
- `packages/developer/runway/src/core/functions/pool-max-of.function.ts` (the per-instance share of `poolBudget`)
- the stall reproduced against a real Postgres in `postgres-database-pool-nesting.driver.int.test.ts`

## Impact

- **Apps touched**: none (apps/docs: ADR 0473 gains the 2026-11-26 note; ADR 0495 links it)
- **Services touched**: none changed; every service on `PostgresDatabaseDriver` gets the gate at its next release
- **Packages touched**: packages/data/database (the gate, its error, two pool fields, `runTransaction`,
  `CrudService`, the driver, manifest, README, AGENTS.md); packages/developer/runway (`poolMaxOf`)
- **Public contract change**: `DatabasePool` / `DatabaseConfig.pool` gains the optional `acquireTimeout` (Duration,
  default 30 seconds) and `nesting` (whole number of at least 1, default 4); a new exported refusal
  `ConnectionPoolExhaustedError` (code `connection_pool_exhausted`, kind `unavailable`, 503, retryable) listed in
  `packages/data/database/stackra.manifest.json`; `poolMaxOf` refuses a `poolBudget` that gives an instance fewer than
  two connections (was fewer than one)
- **Cross-service events**: none
- **Tenancy and data**: no schema or migration; a `requiresNew` transaction still replays the caller's row-security
  settings (STA-2565) inside the gate, so tenant isolation is unchanged
- **Security and privacy**: none; the refusal carries no details
- **Secrets**: none
- **ADR needed**: no new ADR; implements the 2026-11-26 note of ADR 0473 and settles the ADR 0495 consequence
- **New dependencies**: none (`node:async_hooks` only)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/data/database/README.md (pool table and the gate), packages/data/database/AGENTS.md,
  ADR 0473 note, ADR 0495 consequence line
- **Lane**: full
- **Change risk**: R2 (every Postgres transaction that takes its own connection now passes the gate; a new refusal a
  caller may see under load; a stricter runway budget check)

## Compatibility and migration

- `DatabasePool` gains two optional fields only; existing config parses unchanged and gets the defaults
  (`POOL_GATE_DEFAULTS`: max 10, nesting 4, acquire wait 30 seconds).
- Callers of `runTransaction` and `CrudService` see no signature change. Under load a transaction may now wait for its
  place and, past `acquireTimeout`, fail with `ConnectionPoolExhaustedError` (retryable 503) where it used to hang
  forever. A chain deeper than `max` fails at once with `RangeError` where it used to hang.
- Top-level concurrency per instance drops from `max` to `max - (nesting - 1)`: a pool of 10 runs 7 top-level
  transactions at once. A service that needs its old top-level concurrency raises its budget by `nesting - 1` per
  instance.
- A runway whose `poolBudget` gives an instance exactly one connection now fails `poolMaxOf` with `RunwayInvalidError`
  at its path; such a service could not serve an isolated call anyway. Raise the budget to two per instance or more.
- A savepoint (nested transaction without `requiresNew`), a query outside a transaction, the replica pool and a
  database with no gate (the memory driver's single PGlite connection) are not gated and behave as before.
- `holdConnection` is internal to `@stackra/database` and is not exported. A new path inside the package that opens its
  own connection with `em.transactional` outside `runTransaction` calls it (AGENTS.md rule); code outside the package
  opens transactions through `runTransaction` or `CrudService`, which are gated.

## Risks

- A second connection taken outside the gate (for example `em().fork().getConnection()` in a port example) can still
  wait forever, since `poolConfig` does not map `acquireTimeout` to the `pg` pool's `connectionTimeoutMillis` and
  `translateDbError` has no mapping for the `pg` pool's own timeout. Every known `requiresNew` store is gated, so the
  reported stall is fixed; the gap is a review follow-up (low).
- The runway floor is two connections per instance while the default `nesting` is 4; the gate caps its levels at
  `max`, so a minimum-size pool runs, but chains deeper than its `max` are refused. The floor and the ADR note should
  agree; a review follow-up (low).
- Lower top-level concurrency per pool (see Compatibility) may raise queueing latency for a service sized to the
  edge of its budget.

## Acceptance criteria

- **AC-001**: WHEN a transaction opens on its own connection THE driver SHALL admit it through that database's
  `ConnectionGate` at its depth before it opens (a top-level or `requiresNew` one, on a connected Postgres database).
- **AC-002**: WHEN a transaction opens as a savepoint inside a running transaction THE driver SHALL run it at once,
  without the gate.
- **AC-003**: THE `ConnectionGate` SHALL run at most `max - (levels - d)` transactions at depth `d` or shallower,
  where `levels` is `nesting` capped at `max`, so that WHEN more concurrent chains no deeper than `nesting` arrive than
  the pool has connections every chain finishes.
- **AC-004**: IF a chain would hold more connections than the pool's `max` THEN THE gate SHALL refuse it at once with
  a `RangeError`, holding no place after.
- **AC-005**: IF a transaction waits for its place longer than the pool's `acquireTimeout` THEN THE gate SHALL refuse
  it with the retryable `ConnectionPoolExhaustedError` (`connection_pool_exhausted`, unavailable, 503) and give back
  nothing it did not take.
- **AC-006**: WHERE `DatabaseConfig.pool` sets `acquireTimeout` or `nesting` THE config SHALL take them, and IF
  `nesting` is below one THEN THE config SHALL refuse it with `ConfigInvalidError`.
- **AC-007**: WHEN `CrudService` runs an own-transaction write (`REQUIRES_NEW`) THE service SHALL admit it through the
  same gate.
- **AC-008**: IF a runway budget gives an instance under two connections THEN THE `poolMaxOf` SHALL refuse it
  with `RunwayInvalidError` at the `poolBudget` path.
- **AC-009**: THE package SHALL export `ConnectionPoolExhaustedError` and list it in its manifest's errors.

## Status history

- 2026-11-26 → Clarified (the stall reproduced against Postgres; ADR 0495 consequence and ADR 0473 decision 2)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 → Tasked (tasks.md; built in the same branch, stackra#1096)
