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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                             |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/cache`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                              |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                            |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                     |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                   |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                           |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                        |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                  |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                               |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                          |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`,
  `zod` only; no app, service or `encore.dev`; no vendor client.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`; no `@Cached`, no `ctx.cache` (rule 33).
- Secrets: none.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./contracts`, and nothing under `src/contracts/` imports another entry — Validates: FR-001
- **P-002**: `./contracts` exports `Cache` and `CacheNamespace` and nothing else, and `.` exports no `Cache` — Validates: FR-002
- **P-003**: `.` exports `CacheKey`, `CacheConfig`, `CacheConfig$`, `CacheOptions`, `MemoryCacheDriver` and `SharedCacheNamespaceDriver` — Validates: FR-003
- **P-004**: after `forget(key)`, `get(key)` and `get` of every key that `key` covers find nothing, and `get`, `put`, `remember` and `forget` are the whole `Cache` port — Validates: FR-004
- **P-005**: a driver prefixes every key with `CacheNamespace.current()`, and two concurrent `remember` calls on one scoped key run the loader once — Validates: FR-005
- **P-006**: `CacheKey.of(Model, ...parts)` is the only way to make a `CacheKey`, so a plain string passed to `Cache.get` fails to compile — Validates: FR-006
