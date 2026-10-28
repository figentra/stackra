# AGENTS — @stackra/cache

The cache port, its keys and its drivers. Member at `packages/runtime/cache` (`tier:lib`), in the programming model
v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node` (the Valkey driver) and `./worker` (the Workers KV
driver).

## Where code goes

| You are writing…              | It goes in…                                 |
| ----------------------------- | ------------------------------------------- |
| A port                        | `src/contracts/ports/<name>.port.ts`        |
| A type a port needs           | `src/contracts/types/<name>.type.ts`        |
| A driver                      | `src/core/drivers/<name>.driver.ts`         |
| A server-only driver          | `src/node/drivers/<name>.driver.ts`         |
| A Workers-only driver         | `src/worker/drivers/<name>.driver.ts`       |
| A function, a constant, shape | `src/core/{functions,constants,schemas}/`   |
| The configuration             | `src/config/cache.config.ts`                |
| A test                        | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{core,contracts,node,worker}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `Cache` and `CacheNamespace` are exported from `./contracts` only, never from `.` (ADR 0294 decision 15). The
  `CacheKey` brand type sits in `src/contracts/types/` for the port's signature but is exported only from `.`, beside
  `CacheKey.of`. `./contracts` imports no other entry.

## This package

- Every driver is `storedCache` (`src/core/functions/`) over a `CacheEntryStore`: `memoryEntryStore`, or
  `textEntryStore` over an outside `CacheStore`. `storedCache` owns the namespace prefix, `coversKey`, tags, the stale
  window, the `CacheLock` fill, jitter, metrics and single-flight; a `put`, `forget` or `forgetTag` marks a covered
  load (or background reload) stale so it is not stored. Never repeat that in a driver.
- A store that lists a prefix cheaply gives `keys`; one that cannot (Valkey) leaves it out and `storedCache` indexes
  each key under every covering key instead. Never `SCAN` or list a whole store. Set names start `k/` (covered keys)
  or `t/` (tags) and are kept apart from entry keys by `#` (Valkey) or marker keys under `#` (`markerSets`).
- A metric carries the key's owner only (`keyOwner`), never a key part, the namespace or a value, and a throwing
  metrics driver never changes an answer.
- `cache.lock` and `cache.metrics` select the `CacheLock` and `CacheMetrics` drivers; keep `CACHE_LOCK_DRIVERS`,
  `CACHE_METRICS_DRIVERS`, the schema enums and the `DriverRegistry` entries together. `locks` lives in
  @stackra/locking (`LocksCacheLockDriver`), which depends on this package; never the reverse.
- `./worker` code reads Worker bindings only through `workerBinding` (`src/worker/functions/`), which tests mock.
- No tenant word here (final review R-59): scoping goes through `CacheNamespace`.
- `cache.namespace` selects the `CacheNamespace` driver (`shared`, or `scope` from @stackra/scope); keep
  `CACHE_NAMESPACE_DRIVERS`, the schema enum and the `DriverRegistry` entry together. A new `Cache` driver joins
  `DRIVERS` in `cache-namespace.conformance.test.ts` (ADR 0150 enforcement, STA-1442).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.
- `CacheHealthIndicatorDriver` is the `HealthIndicator` driver: it reads one key that is never written, bounded by `health.timeout`; `health.critical: false` reports `degraded` instead of `down`. It reports the error's name, never its message.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data          | Where                                                                     | Handling                                                                      |
| ------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Cached values | process memory, the client `cache` area, Valkey or Workers KV (by driver) | Whatever the caller stores, kept until expiry or eviction; never logged here. |
| Tags          | the same store as the values                                              | Keys from `CacheKey.of`; no personal data unless a caller puts it in a key.   |
| Metrics       | `CacheMetrics` drivers (counters, debug lines)                            | Key owner and numbers only.                                                   |
