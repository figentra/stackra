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

- Every driver prefixes keys with the URI-encoded `CacheNamespace.current()` and `/`, forgets with `coversKey`, and
  single-flights `remember` per scoped key; a `put` or `forget` marks a covered flight stale so it is not stored. A
  driver over an outside store hands a `CacheStore` to `storedCache` (`src/core/functions/`) instead of repeating that.
- `./worker` code reads Worker bindings only through `workerBinding` (`src/worker/functions/`), which tests mock.
- No tenant word here (final review R-59): scoping goes through `CacheNamespace`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data          | Where                                                                     | Handling                                                                      |
| ------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Cached values | process memory, the client `cache` area, Valkey or Workers KV (by driver) | Whatever the caller stores, kept until expiry or eviction; never logged here. |
