# Feature Specification: `@stackra/cache` wave 2, the Cache port, CacheKey and the memory driver

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/cache` (runtime, wave 2) for real: the `Cache` port, `CacheKey.of`, keys scoped per call
namespace, single-flight loads, a configuration, and the memory driver.

## Impact

- **Apps touched**: none (the template's web wiring imports `Cache` from `./contracts` already; STA-344)
- **Services touched**: none (the template's commerce service imports `{ type Cache, CacheKey }` from `.`; STA-344 moves
  `Cache` to `@stackra/cache/contracts`)
- **Packages touched**: `packages/runtime/cache` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables. Keys are prefixed with the call's namespace (`CacheNamespace` port), which the
  tenancy package binds; this package names no tenant (final review R-59)
- **Secrets**: none
- **ADR needed**: no (ADR 0150, 0297 decision 3, 0305 rules 31 to 33, 0294 decisions 15 to 17)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation`,
  `@stackra/config` through `workspace:*`; `zod` through `catalog:`
- **Deploy modes**: same in all; the memory driver makes no outbound call (air-gapped safe)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/cache/README.md`, `packages/runtime/cache/AGENTS.md`; ADR 0120, 0150, 0294, 0297, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (the key scoping is the isolation boundary between namespaces)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entries `.` and `./contracts`, depends on config; conflict A3
  resolved as in `@stackra/errors`: the port `Cache` is exported from `./contracts` only; ADR 0305 rules 31 to 33,
  ADR 0150 as amended by 0297

## User Scenarios & Testing

### User Story 1 - Cache a value in a service (Priority: P1)

`ProductService` injects `Cache` and calls
`this.cache.remember(CacheKey.of(Product, id, locale), Duration.minutes(10), load)`. The first call loads and stores;
later calls within ten minutes return the stored value; concurrent first calls share one load.

**Independent Test**: `src/core/drivers/__tests__/memory-cache.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** an empty cache, **When** `remember` is called twice concurrently, **Then** `load` runs once and both get its
   value.
2. **Given** a stored value, **When** its lifetime passes on the clock, **Then** the next `remember` loads again.
3. **Given** a `load` that rejects, **Then** nothing is stored and the next call loads again.
4. **Given** `maxEntries: 2` and three keys, **Then** the least recently read key is dropped.

### User Story 2 - Forget a model's values after a change (Priority: P1)

`ArchiveProductAction` calls `ctx.afterCommit(() => this.cache.forget(CacheKey.of(Product, product.id)))`.

**Independent Test**: `src/core/drivers/__tests__/memory-cache.driver.test.ts`,
`src/core/constants/__tests__/cache-key.constant.test.ts`.

1. **Given** views stored under `CacheKey.of(Product, id, "en")` and `CacheKey.of(Product, id, "ar")`, **When**
   `forget(CacheKey.of(Product, id))` runs, **Then** both are gone and `CacheKey.of(Product, otherId, "en")` stays.
2. **Given** a load in flight for a covered key, **When** `forget` runs, **Then** the load's result is returned to its
   callers but not stored, and the next call loads again.
3. **Given** a part that contains `:`, **Then** it cannot make one key cover another.

### User Story 3 - Keys never cross namespaces (Priority: P1)

**Independent Test**: `src/core/drivers/__tests__/memory-cache.driver.test.ts`.

1. **Given** two calls whose `CacheNamespace.current()` differ, **Then** the same `CacheKey` reads, writes and forgets
   separately.
2. **Given** no namespace binding beyond the default, **Then** `SharedCacheNamespaceDriver` gives one shared namespace.

### User Story 4 - Configure the cache (Priority: P2)

**Independent Test**: `src/config/__tests__/cache.config.test.ts`, `src/core/schemas/__tests__/cache-options.schema.test.ts`.

1. **Given** `CacheConfig`, **Then** its key is `cache.cache` and it builds with `maxEntries: 10000`.
2. **Given** `CacheConfig$`, **Then** its output type equals `CacheOptions`' fields and it refuses `maxEntries < 1`.

## Requirements

- **FR-001**: Two entries, `.` and `./contracts` (registry row, ADR 0294 decision 15); `./contracts` imports no other
  entry.
- **FR-002**: `./contracts` exports `Cache` and `CacheNamespace` only; `Cache` is not exported from `.` (A3).
- **FR-003**: `.` exports `CacheKey` (template), `CacheConfig`, `CacheConfig$`, `CacheOptions`, `MemoryCacheDriver`,
  `SharedCacheNamespaceDriver`.
- **FR-004**: `Cache` has `get`, `put`, `remember` and `forget`; `forget(key)` drops the key and every key it covers.
- **FR-005**: Every driver prefixes keys with `CacheNamespace.current()` and single-flights `remember` per scoped key.
- **FR-006**: A key is built only by `CacheKey.of(Model, ...parts)` (ADR 0305 rule 32); the port's parameter type is
  the branded `CacheKey`, so a plain string does not type-check.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/cache` and `@stackra/cache/contracts` exists with the shape
  it uses: `Cache` (a class token with `remember(key, Duration, load)` and `forget(key)`), `CacheKey.of(Model, ...parts)`.
- **SC-002**: Every public symbol has a test beside it; the barrel tests pin each entry's exports.
- **SC-003**: Lint and format pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- Redis, Encore, storage and Workers drivers: each needs a client or package that does not exist yet (Workers needs a
  runtime-target entry, A2/Q4).
- `CacheScope` and the query `cache:` option runtime: the option belongs to `Query({...})` in `@stackra/actions` (not
  built), and `CacheScope.Tenant` (ADR 0305 rule 31) conflicts with the R-59 tenant-vocabulary rule; owner call.
- Tags and stale-while-revalidate (ADR 0150 decision 4): no template caller; prefix forget covers the template.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
