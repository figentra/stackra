# @stackra/cache

## 0.1.0

### Minor Changes

- c547718: Add the decided `Cache` drivers behind the existing port: `StorageCacheDriver` (`storage`, `.`) over the client storage
  `cache` area, `ValkeyCacheDriver` (`valkey`, new `./node` entry) over a Valkey server named by the `CACHE_VALKEY_URL`
  secret, and `WorkersCacheDriver` (`workers`, new `./worker` entry) over the Workers KV namespace bound under
  `cache.workers.binding`. Each keeps namespaced keys, expiry on the `Clock`, the covering `forget` and per-process
  single-flight. `CacheConfig` gains `driver`, `valkeyUrl`, `valkey.keyPrefix` and `workers.binding`. No Encore cache
  driver: see the README.
- d72a734: Add `CacheHealthIndicatorDriver`, the `HealthIndicator` named `cache` that reads one never-written key, and the `health` field of `CacheConfig` (probe timeout `PT2S`, `critical`) (STA-1379).
- 2787c1e: Add `@stackra/cache`, the cache of the programming model v3.1: the `Cache` port (`get`, `put`, `remember`, `forget`;
  exported from `./contracts` only), where `remember` shares one load between concurrent callers and `forget` drops a key
  and every key it covers; `CacheKey.of(Model, ...parts)`, the only maker of a key; the `CacheNamespace` port that every
  driver puts in front of each key, with `SharedCacheNamespaceDriver` as its default; `MemoryCacheDriver` (least recently
  read dropped past the bound, expiry from the `Clock`); and the `CacheConfig` configuration (`cache.cache`,
  `maxEntries`) with its shipped schema `CacheConfig$`.
- 4502f57: Add the `postgres` driver of `Cache` (`PostgresCacheDriver`, `./node`) for services with no Valkey: entries and tag
  members in two unlogged tables in `postgres.schema` (default `cache`), a prefix `forget` over the "C"-collated primary
  key, and a bounded sweep of dead rows per write (`postgres.sweep`, default 100). Its statements run through the new
  `CacheSql` port (`./contracts`), which @stackra/database binds; `postgresCacheTables(schema)` gives the create
  statements for the migration (STA-1438).
- bc4acfc: `Cache` gains tags and `forgetTag(tag)` (`put` and `remember` take `{ tags }`), stale-while-revalidate
  (`remember(..., { stale })`), one fill across instances (`remember(..., { lock: true })` over the new `CacheLock` port)
  and lifetime jitter (`cache.jitter`), plus the `CacheMetrics` port with the `none`, `counting` and `logger` drivers
  (`cache.metrics`). Every driver now runs one shared `storedCache` over an entry store; the Valkey driver indexes keys
  and tags in sorted sets, so `forget` no longer walks `SCAN` and no command touches two keys. New config fields `lock`,
  `metrics`, `jitter` and `fill` (`wait`, `poll`). The driver constructors take the `CacheMetrics` port (and the Valkey and
  Workers drivers the `CacheLock` port). `@stackra/locking` ships `LocksCacheLockDriver` (`cache.lock: locks`) and now
  depends on `@stackra/cache`. `@stackra/actions`' test fakes implement `forgetTag` (STA-1435).
- acff14a: Erasure fan-out, cache and AI parts (data-layer gaps gov6 and ca16; STA-1444). `CacheKey.subject(id)` is the subject
  tag (`~subject:<id>`) every entry holding a person's data carries, so an erasure drops them with
  `forgetTag(CacheKey.subject(id))`. `ConversationStore.forget(principalId)` erases a principal's conversations and their
  messages in the memory and Postgres drivers; a message under a legal hold stays with its conversation.
- 376a093: Add `ScopeCacheNamespaceDriver`, the `scope` driver of the `CacheNamespace` port: cache keys sit behind the running
  call's scope id (`""` for a platform call or outside every call). `CacheConfig` gains `namespace`
  (`DriverName<CacheNamespace>`, `shared` by default), which selects the namespace driver, and `CacheNamespace` carries
  the `cache.CacheNamespace` port key. A conformance test runs every `Cache` driver with two namespaces (ADR 0150
  enforcement, STA-1442). New dependencies of `@stackra/scope`: `@stackra/actions`, `@stackra/cache`.

### Patch Changes

- 483eb44: Add the `Cached({ ttl })` model trait and `cacheTtlOf` (@stackra/model; a model with encrypted fields is refused).
  `CrudService.findOne` and `findOneOrFail` by `{ id }` alone, outside a transaction and with no visibility condition,
  read a `Cached` model's row through the shared `Cache` (MikroORM's result cache over `EntityResultCacheAdapter`, set by
  `PostgresDatabaseDriver`), keyed by `CacheKey.of(Model, id, scopeId, scopeNodeId)`. New `CacheInvalidationService`, an
  outbox change consumer that forgets `CacheKey.of(Model, id)` after every committed change. @stackra/database now
  depends on `@stackra/cache` (data-layer gaps ca4, ca5, cdc10; STA-1431).
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
