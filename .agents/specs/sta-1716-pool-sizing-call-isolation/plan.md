# Implementation Plan: a connection gate admits pool transactions by depth, so call isolation never stalls the pool

**Spec**: `.agents/specs/sta-1716-pool-sizing-call-isolation/spec.md` · **Linear**: STA-1716 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1716-pool-sizing-call-isolation/spec.md`

## Summary

`PostgresDatabaseDriver.connect` builds one `ConnectionGate(max, nesting, acquireTimeout)` per database and records it
in `CONNECTION_GATES` by the ORM driver. `holdConnection(em, work, requiresNew)` finds the gate and, for a transaction
that takes a connection of its own, waits for a place at its depth before `em.transactional` opens. `runTransaction`
and `CrudService`'s own-transaction writes call it. `DatabasePool` gains `acquireTimeout` and `nesting`; the new
retryable `ConnectionPoolExhaustedError` is exported and listed in the manifest; `poolMaxOf` refuses a share below two.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/data/database`, `packages/developer/runway`
- **Testing**: vitest in `src/**/__tests__/`; the driver integration test runs against a real Postgres
- **Storage**: Postgres through MikroORM and the `pg` pool; no schema change
- **Runtime target**: every service and worker on `PostgresDatabaseDriver`

## Constitution Check

| Law                                   | Result | Note                                                            |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                                   |
| Secrets (ADR 0009)                    | N/A    | none read or written                                            |
| Security                              | PASS   | the refusal carries no details                                  |
| HTTP and events                       | PASS   | a new 503 refusal code, listed in the manifest                  |
| Tenancy                               | PASS   | `requiresNew` still replays the caller's row-security settings  |
| Delegation                            | PASS   | Claude only                                                     |
| Not built yet (ADR 0011)              | N/A    | none                                                            |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                                      |
| Versions and catalogs                 | PASS   | a minor changeset for `@stackra/database` and `@stackra/runway` |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                               |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                       |
| Docs and ADRs                         | PASS   | ADR 0473 note, ADR 0495 link, the database README and AGENTS.md |

## Deploy modes

| Mode       | Behaviour                                                                  |
| ---------- | -------------------------------------------------------------------------- |
| SaaS       | the gate sizes from `pool.max`, which the deploy sets from `poolBudget`    |
| On-prem    | the same; `pool.nesting` and `pool.acquireTimeout` from config or defaults |
| Air-gapped | the same; the gate is in-process and makes no call out                     |

## Correctness properties

- **P-001**: a top-level or `requiresNew` transaction calls `ConnectionGate.hold`; a savepoint does not — Validates:
  AC-001, AC-002
- **P-002**: with the gate, more concurrent two-deep and three-deep chains than connections all finish, where the same
  chains with no gate stall; the top level holds at most `max - (nesting - 1)` places — Validates: AC-003
- **P-003**: a chain deeper than `max` is refused with `RangeError` and every level holds zero after — Validates:
  AC-004
- **P-004**: a wait past `waitMs` rejects with `ConnectionPoolExhaustedError`, retryable, and the next call is served —
  Validates: AC-005
- **P-005**: `DatabaseConfig` takes `acquireTimeout` and `nesting` and refuses `nesting: 0` — Validates: AC-006
- **P-006**: `CrudService`'s own-transaction write goes through `holdConnection` — Validates: AC-007
- **P-007**: `poolMaxOf` refuses a budget of 7 over 4 instances and gives 2 for 8 over 4 — Validates: AC-008
- **P-008**: the core index exports `ConnectionPoolExhaustedError` and the manifest lists `connection_pool_exhausted`
  — Validates: AC-009

## Architecture overview

Each connected Postgres database has one gate. A transaction that takes a connection of its own asks the gate for a
place at its depth, read from an `AsyncLocalStorage` the gate sets one level deeper for the admitted work. Of `max`
places, `levels = min(nesting, max)` levels are kept so that at most `max - (levels - d)` transactions run at depth
`d` or shallower: the top level gets `max - (levels - 1)` and each deeper level one more, so the deepest transaction a
chain needs always finds a place. Waiters are served in arrival order, skipping one that does not fit yet, so a
waiting top-level call never blocks a deeper one. The gate counts places, not `pg` connections; the `pg` pool is
unchanged.

## Components and responsibilities

- `ConnectionGate` (`core/values`): admission by depth, the `RangeError` for a chain deeper than `max`, the timed
  refusal, `snapshot()` for tests.
- `CONNECTION_GATES` (`core/constants`): the gate of each database by its MikroORM driver, shared by every fork.
- `POOL_GATE_DEFAULTS` (`core/constants`): max 10, nesting 4, acquire wait 30 seconds.
- `holdConnection` (`core/functions`): finds the gate; skips a savepoint and a database with no gate.
- `runTransaction`, `CrudService`: wrap their `em.transactional` in `holdConnection`.
- `PostgresDatabaseDriver`: builds the gate in `connect`, removes it in `close`.
- `ConnectionPoolExhaustedError` (`core/errors`): the retryable `unavailable` refusal.
- `DatabasePool`, `DATABASE_POOL_SCHEMA`: the two optional fields.
- `poolMaxOf` (runway): the share floor of two.

## Files and folders

```text
packages/data/database/
  AGENTS.md
  README.md
  stackra.manifest.json
  src/config/__tests__/database.config.test.ts
  src/core/__tests__/index.test.ts
  src/core/bases/crud-service.base.ts
  src/core/bases/__tests__/crud-service.base.test.ts
  src/core/constants/{connection-gates,database-pool-schema,pool-gate-defaults}.constant.ts
  src/core/errors/connection-pool-exhausted.error.ts
  src/core/errors/__tests__/connection-pool-exhausted.error.test.ts
  src/core/functions/{hold-connection,pool-config,run-transaction}.function.ts
  src/core/functions/__tests__/run-transaction.function.test.ts
  src/core/index.ts
  src/core/types/database-pool.type.ts
  src/core/values/connection-gate.value.ts
  src/core/values/__tests__/connection-gate.value.test.ts
  src/node/drivers/postgres-database.driver.ts
  src/node/drivers/__tests__/postgres-database-pool-nesting.driver.int.test.ts
packages/developer/runway/src/core/functions/pool-max-of.function.ts
packages/developer/runway/src/core/functions/__tests__/pool-max-of.function.test.ts
apps/docs/src/docs/adr/0473-connection-pooling-a-managed-proxy-per-cloud-a-pool-budget-per-service-and-a-direct-url-for-session-tools.mdx
apps/docs/src/docs/adr/0495-every-call-and-background-unit-runs-in-a-transaction-local-isolation-context.mdx
.changeset/database-connection-gate.md
```

## Data models and migrations

none

## Contracts

- `DatabasePool` (`DatabaseConfig.pool`, `DatabaseOptions.pool`): `acquireTimeout?: Duration` and `nesting?: number`,
  both optional, the schema leaves them out unless set.
- `ConnectionPoolExhaustedError`: exported from `@stackra/database`; manifest error `connection_pool_exhausted`, kind
  and category `unavailable`, module `database`.
- `poolMaxOf`: throws `RunwayInvalidError` for a share below two (message names the two a call under isolation holds).
- Internal only: `ConnectionGate`, `CONNECTION_GATES`, `POOL_GATE_DEFAULTS`, `holdConnection`.

## Error handling

- A chain deeper than `max`: `RangeError` at once, naming the depth and the pool size; nothing held after.
- A wait past `acquireTimeout`: `ConnectionPoolExhaustedError` (retryable 503), the waiter removed from the queue.
- Work that throws gives its place back and wakes the waiters that now fit.
- A bad gate (`max` or `nesting` below 1, negative wait): `RangeError` at `connect`; `nesting: 0` in config fails the
  schema first with `ConfigInvalidError`.

## Security and tenancy

No tenant data or settings pass through the gate. A `requiresNew` transaction still reads the caller's row-security
settings before it opens and replays them first inside it (STA-2565); the gate only delays the open. The refusal
carries no details.

## Testing strategy

- AC-001, AC-002: `run-transaction.function.test.ts` (two gated opens, a savepoint not gated).
- AC-003: `connection-gate.value.test.ts` (two-deep chains beyond the pool finish, the same stall with no gate;
  three-deep and mixed depths on a pool of three; places per level; a deeper waiter served before a shallow one) and
  `postgres-database-pool-nesting.driver.int.test.ts` (real Postgres: nine concurrent calls on a pool of three, each
  taking a rate-limit token through the real `requiresNew` store; three-deep chains on a pool of three).
- AC-004: the gate test and the integration test (a chain deeper than the pool refused at once).
- AC-005: `connection-pool-exhausted.error.test.ts`, the gate test (wait past `waitMs`, place given back on throw) and
  the integration test (a call past `acquireTimeout` refused, the next served).
- AC-006: `database.config.test.ts`.
- AC-007: `crud-service.base.test.ts` (the recording entity manager now exposes `getDriver`).
- AC-008: `pool-max-of.function.test.ts`.
- AC-009: `core/__tests__/index.test.ts` and the manifest entry.
- Each unit test fails with the change reverted (PR notes); typecheck, oxlint and oxfmt on the touched packages.

## Rollout

A minor changeset for `@stackra/database` and `@stackra/runway`. Services pick the gate up when they move to the
release; no config change is needed. A service sized to its budget's edge checks its top-level concurrency
(`max - (nesting - 1)`); a runway with a share of one is refused at deploy and must raise its `poolBudget`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2. Follow-ups from review: map `acquireTimeout` to the `pg` pool's
`connectionTimeoutMillis` and translate its timeout (or correct the error's file contract); make the runway floor and
the ADR note agree with the default `nesting`.

## ADRs

ADR 0473 (the 2026-11-26 note: the gate and a share of at least two); ADR 0495 (consequence settled).

## Docs

`packages/data/database/README.md`, `packages/data/database/AGENTS.md`, the two ADRs.

## Complexity tracking

none
