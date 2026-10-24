# Plan: `@stackra/cache` wave 2

**Spec**: `.agents/specs/sta-348-cache/spec.md`

## Design

- `Cache` (`src/contracts/ports/cache.port.ts`) is an abstract class extending `Port`, with `get`, `put`, `remember` and
  `forget`, all async so a network driver fits. It is exported from `./contracts` only, as `ErrorReporter` is in
  `@stackra/errors` (A3).
- `CacheNamespace` (`src/contracts/ports/cache-namespace.port.ts`) is the seam that scopes keys: `current()` names the
  call's namespace. `SharedCacheNamespaceDriver` returns `""`; the tenancy package binds its own driver. No tenant word
  in this package (R-59).
- The `CacheKey` brand type lives in `src/contracts/types/` (the port's parameter type, not exported from
  `./contracts`); `src/core/constants/cache-key.constant.ts` re-declares the type beside the `CacheKey.of` value, so
  `.` exports both under one name. A key is `<ModelName>:<part>:<part>`, each part `encodeURIComponent`-ed, so `:`
  only ever separates parts.
- `coversKey(parent, key)` (internal function): `key === parent` or `key` starts with `parent + ":"`.
- `MemoryCacheDriver extends Driver(Cache)` takes `CacheConfig`, `CacheNamespace` and `Clock`. Entries are a `Map` in
  LRU order (a read moves the key to the end; past `maxEntries` the oldest goes). Expiry uses the clock. `remember`
  keeps one flight per scoped key; `forget` and `put` mark a covered flight stale so its result is not stored.
- `CacheOptions` (shape, `@Int({ min: 1 }) maxEntries = 10_000`) registers `CACHE_CONFIG_SCHEMA`; `CacheConfig` is
  `Config({ schema: CacheOptions })`; the barrel exports the schema as `CacheConfig$`.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`,
  `zod` only; no app, service or `encore.dev`; no vendor client.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; no `@Cached`, no `ctx.cache` (rule 33).
- Secrets: none.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).
