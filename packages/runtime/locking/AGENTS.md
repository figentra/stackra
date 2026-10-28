# AGENTS — @stackra/locking

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/locking.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0103; ADR 0149; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

Named server-side locks: the `Locks` service, the `LockDriver` port, the memory and Postgres drivers, the cache fill
lock driver (`LocksCacheLockDriver`) and the
token-sequence migration (ADR 0103, ADR 0149). Member at `packages/runtime/locking` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`.

## Where code goes

| You are writing…                          | It goes in…                                               |
| ----------------------------------------- | --------------------------------------------------------- |
| The configuration (`LockingConfig`)       | `src/config/locking.config.ts`                            |
| Its options shape                         | `src/core/schemas/locking-options.schema.ts`              |
| Its shipped zod schema (`LockingConfig$`) | `src/core/constants/locking-config-schema.constant.ts`    |
| The port or a type it uses                | `src/contracts/{ports,types}/`                            |
| An isomorphic driver, refusal, service    | `src/core/{drivers,errors,services}/`                     |
| A server driver                           | `src/node/drivers/`                                       |
| A migration                               | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| A test                                    | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` and `node` import it through `#contracts/index`.
- `LockingConfig$` mirrors `LockingOptions` by hand until gen compiles this package's schemas; change both together.
- `LOCK_DRIVERS` names each driver by its file prefix; a new driver adds its name there.

## This package

- A driver never waits and never sorts: `Locks` normalises the keys, polls `tryAcquire` with backoff (the contracts `backoffDelay`, 10 ms doubling to 160 ms) and runs the
  renewal timer, so every driver behaves the same and no statement blocks inside a caller's transaction.
- Postgres locks are transaction-level advisory locks: they end with the transaction, so `renew` and `release` send
  nothing. Never switch to session-level locks through the pooled entity manager: an unlock can land on another
  connection and leak the lock.
- Raw SQL only in `PostgresLockDriver`, every key bound, each statement with a `// raw-sql:` reason (ADR 0160). A
  released migration is frozen; a change is a new migration.
- The refusal carries no key: a key is an internal name.
- The Valkey driver's scripts compare the stored `<owner>:<token>` before they renew or delete, so a lapsed lease never
  touches its successor's key. Its URL is the `LOCKING_VALKEY_URL` secret, never a value.
- No tenant word here (final review R-59, ADR 0323), and no `@WithLock` (registry A9).
- `LocksCacheLockDriver` is @stackra/cache's `CacheLock` driver `locks`; it imports only `@stackra/cache/contracts`.
  @stackra/cache never depends on this package (the dependency runs one way).
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data      | Where                                              | Handling                                                                       |
| --------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Lock keys | Postgres `pg_locks` (as a 64-bit hash), memory map | Internal names chosen by callers (public ids, not personal data); never logged |
