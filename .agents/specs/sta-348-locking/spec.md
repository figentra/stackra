# Feature Specification: `@stackra/locking` wave 5, named locks with fencing tokens

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/locking` (runtime, wave 5): the `Locks` service a module service injects to run work under
named server-side locks, the `LockDriver` port behind it, a memory driver and the Postgres advisory-lock driver
(ADR 0103 as amended by ADR 0149). The scheduler (wave 6) builds single-runner cron dispatch and misfire catch-up on it.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce `StockService` adopts it once converted, STA-344)
- **Packages touched**: `packages/runtime/locking` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no table; one sequence (`locking.lock_tokens`) for fencing tokens in the package's own schema;
  advisory locks live in Postgres memory and end with their transaction; no tenant vocabulary (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0103 and 0149 decide the package; ADR 0160, 0294 and 0305 bind it); the gaps are listed under
  Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  config, container, contracts, database, errors and validation
- **Deploy modes**: same code in all; Postgres 11 or later for `hashtextextended`
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/locking/README.md`, `packages/runtime/locking/AGENTS.md`; ADR 0103 and 0149 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract that stock reservation and the scheduler rely on for mutual exclusion)

## Clarifications

### Session 2026-10-24

The package follows ADR 0103 and 0149, the v3.1 registry row and the owner decisions of 2026-10-24 (programming model
v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entry `.` exports `Locks`; the port goes to `./contracts` and the Postgres driver to `./node`, because
  each has a file (ADR 0127 note: an entry exists once its folder has a file). No `./testing`: the memory driver in `.`
  is the fake, as `MemorySearchDriver` is search's
- Registry A9: the old `@WithLock` method decorator is dropped; callers inject `Locks` and call `locks.with(...)`, as
  the template's `StockService#reserve` does
- Template contract: `locks.with(keys, Duration.seconds(5), async () => ...)` with string keys; the keys are sorted, so
  overlapping key sets never wait on each other in a cycle
- Postgres locks are transaction-level advisory locks (`pg_try_advisory_xact_lock`): a lock taken inside the caller's
  transaction lasts until that transaction ends, so it covers the caller's commit, and it cannot outlive its holder;
  outside a transaction, `Locks` opens one around the work
- Waiting is polling of a try-lock with backoff, the same on every driver, so no statement blocks inside the caller's
  transaction and a timeout never aborts it
- Fencing tokens come from one Postgres sequence (monotonic across holders); the memory driver counts
- Scheduler needs (wave 6): `tryWith` (no waiting, reports whether the work ran), a lease that carries its owner and
  token, and a TTL the holder renews automatically
- Owner, 2026-10-24 (R-59, ADR 0323): no tenant vocabulary; a key names its scope itself when it needs one

## User Scenarios & Testing

### User Story 1 - Serialise writes under named locks (Priority: P1)

A module service injects `Locks` and runs `locks.with(keys, ttl, work)`; two calls with overlapping keys run one after
the other, and calls with disjoint keys run side by side.

**Independent Test**: `src/core/services/__tests__/locks.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a key held by one call, **When** a second call asks for it, **Then** the second waits and runs once the
   first ends.
2. **Given** a key held past the TTL by a live holder, **When** a call asks for it, **Then** it refuses
   `lock_unavailable` after waiting at most the TTL.

### User Story 2 - Run on one instance only (Priority: P1)

The scheduler calls `locks.tryWith(key, ttl, work)` on every instance; exactly one runs the work and the others get
`false` at once.

**Independent Test**: `src/core/services/__tests__/locks.service.test.ts`.

### User Story 3 - Lock in Postgres (Priority: P1)

The Postgres driver takes transaction-level advisory locks per key and draws a fencing token from the sequence.

**Independent Test**: `src/node/drivers/__tests__/postgres-lock.driver.test.ts`,
`src/node/database/migrations/__tests__/0001-create-lock-tokens.migration.test.ts`.

### User Story 4 - Lock in a test or a single process (Priority: P2)

The memory driver holds leases in process memory, expires them on the clock and renews them.

**Independent Test**: `src/core/drivers/__tests__/memory-lock.driver.test.ts`.

### Edge Cases

- No key: the work runs under an empty lease.
- The same key twice: taken once.
- A TTL of zero: a `RangeError` (a programming error, not a caller's).
- The work throws: the lease is released and the error passes through.
- A renewal that fails: the lease counts as lost; the fencing token guards any later write.

## Requirements

- **FR-001**: The package SHALL be `@stackra/locking` at `packages/runtime/locking`, `tier:lib`, entries `.`,
  `./contracts` and `./node` only.
- **FR-002**: It SHALL export `Locks` from `.` with `with(keys, ttl, work)` as the template calls it, `tryWith(keys,
ttl, work)` for the scheduler, and `MemoryLockDriver`, `LockUnavailableError` and the configuration beside it.
- **FR-003**: `LockingConfig` with its shipped `LockingConfig$` SHALL key `locking` with `driver` typed
  `DriverName<LockDriver>` (`postgres` default, `memory`).
- **FR-004**: `Locks` SHALL sort and de-duplicate the keys, wait at most the TTL, renew the lease every third of the
  TTL while the work runs, and release it when the work ends.
- **FR-005**: Every lease SHALL carry its owner and a fencing token larger than every earlier lease's on the same key.
- **FR-006**: `PostgresLockDriver` SHALL take transaction-level advisory locks with every key bound as a parameter, join
  the caller's transaction or open one, and draw the token from `locking.lock_tokens`.
- **FR-007**: `MemoryLockDriver` SHALL take every key or none, expire a lease on the `Clock`, and refuse to renew or
  release a lease that is no longer held.
- **FR-008**: No identifier, comment or default in the package SHALL carry tenant vocabulary, and no `@WithLock`
  decorator SHALL exist.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- ADR 0103 decision 3 (keys scoped by default, a platform-wide lock explicit) is not built: the template's keys hold
  public ids and the scheduler needs platform-wide keys, so a key names its scope itself; a namespace port like
  `@stackra/cache`'s `CacheNamespace` comes when a consumer needs one.
- ADR 0149 decision 5 (lock metrics) waits for a metrics port in `@stackra/contracts`; none exists yet.
- The lock conformance suite (ADR 0149 Enforcement) and a Valkey driver are later work; a Postgres integration test
  runs with the testing workflow.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
