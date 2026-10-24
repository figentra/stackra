# @stackra/locking

Stackra locking: the `Locks` service that runs work under named server-side locks, the `LockDriver` port behind it,
the memory driver, the Postgres advisory-lock driver and the `LockingConfig` configuration (ADR 0103, ADR 0149).

**Tier:** `tier:lib` (`packages/runtime/locking`). Entries `.`, `./contracts` and `./node`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/database`, `@stackra/errors`,
`@stackra/validation` and zod.

## What is here

| Symbol                            | Entry         | Use                                                                                |
| --------------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `Locks`                           | `.`           | `with(keys, ttl, work)` waits for the keys; `tryWith(keys, ttl, work)` never waits |
| `LockUnavailableError`            | `.`           | `lock_unavailable` (503, retryable): the keys stayed held for the whole wait       |
| `LockingConfig`, `LockingConfig$` | `.`           | key `locking`: `driver` (`postgres` default, `memory`)                             |
| `LockingOptions`                  | `.`           | the shape of `LockingConfig`                                                       |
| `MemoryLockDriver`                | `.`           | the driver for tests and a single process                                          |
| `LockDriver`, `LockLease`         | `./contracts` | the port a driver implements, and the lease it gives                               |
| `PostgresLockDriver`              | `./node`      | the default driver: transaction-level advisory locks and a token sequence          |

## Running work under a lock

```ts
import { Duration } from "@stackra/contracts";
import type { Locks } from "@stackra/locking";

export class StockService extends CrudService<StockLevel> {
  constructor(private readonly locks: Locks) {
    super();
  }

  reserve(lines: readonly StockLine[]): Promise<void> {
    const keys = lines.map((line) => StockLevel.lockKey(line.variantId));
    return this.locks.with(keys, Duration.seconds(5), async () => {
      // read, check and change the stock levels
    });
  }
}
```

- `Locks` sorts the keys and takes each once, so two calls with overlapping keys never wait on each other in a cycle.
- `with` waits at most `ttl` for keys another lease holds, then refuses `LockUnavailableError` without running the work.
- The lease is renewed every third of `ttl` while the work runs and released when it ends, however it ends. `ttl` is
  how long a lock outlives a holder that stopped renewing it; it is not a limit on the work.
- A key names its scope itself when it needs one: put a public id or the `ScopeRef` id in it. There is no
  `@WithLock`: inject `Locks` and call it.

## One runner per tick

```ts
const ran = await this.locks.tryWith(`scheduler.cron:${job}`, Duration.minutes(1), () =>
  this.dispatch(job),
);
```

`tryWith` runs the work only when every key is free now, and gives `true` when it ran. Every instance tries; one runs.

## Fencing tokens

The work receives its `LockLease`: its sorted `keys`, its `owner` (the id of the `Locks` that took it, one per process)
and its `token`, which is larger than every earlier lease's on the same key. A store that keeps the last token it saw
and refuses a write with a smaller one stops a holder whose lock lapsed from writing after the next holder (ADR 0149).

## Drivers

- **Postgres** (`./node`, default): `pg_try_advisory_xact_lock` on each key's 64-bit text hash. A lock taken inside
  the caller's transaction lasts until that transaction ends, so it covers the caller's commit and ends when its holder
  dies; outside a transaction, `Locks` opens one around the work. The token comes from `locking.lock_tokens`, created by
  this package's migration `locking.0001_create_lock_tokens`.
- **Memory** (`.`): leases in process memory, expiry on the `Clock`. It serialises callers in one process only.
