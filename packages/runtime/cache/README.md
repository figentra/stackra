# @stackra/cache

Stackra cache: the `Cache` port for a cached value inside a service, driver or listener, `CacheKey.of` to build its
keys and tags, the `CacheNamespace` port that keeps namespaces apart, the `CacheLock` port that shares a fill across
instances, the `CacheMetrics` port that counts hits, misses, loads and evictions, the `CacheConfig` configuration, and
the memory, storage, Valkey, Postgres and Workers KV drivers.

**Tier:** `tier:lib` (`packages/runtime/cache`). Entries `.`, `./contracts`, `./node` and `./worker`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`, `@stackra/storage`, zod and
`iovalkey` (`./node` only).

## What is here

| Symbol                                                   | Entry         | Use                                                                                |
| -------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `Cache`                                                  | `./contracts` | the port: `get`, `put`, `remember`, `forget`, `forgetTag`                          |
| `CacheNamespace`                                         | `./contracts` | the port naming the current call's namespace, put in front of every key            |
| `CacheLock`                                              | `./contracts` | the port that runs a `remember(..., { lock: true })` fill on one instance          |
| `CacheMetrics`                                           | `./contracts` | the port that receives a `CacheMetric` per hit, stale hit, miss, load, evict       |
| `CachePutOptions`, `CacheRememberOptions`, `CacheMetric` | `./contracts` | types: `tags`; `stale` and `lock`; one observation                                 |
| `CacheKey`                                               | `.`           | `CacheKey.of(Model, ...parts)`, the only maker of a key, and its type              |
| `CacheConfig`, `CacheConfig$`                            | `.`           | key `cache.cache`: the driver and each driver's settings (below)                   |
| `CacheOptions`                                           | `.`           | the shape of `CacheConfig`                                                         |
| `MemoryCacheDriver`                                      | `.`           | the `memory` driver of `Cache`                                                     |
| `StorageCacheDriver`                                     | `.`           | the `storage` driver of `Cache`, for client targets                                |
| `SharedCacheNamespaceDriver`                             | `.`           | the default driver of `CacheNamespace`: one shared namespace                       |
| `LocalCacheLockDriver`                                   | `.`           | the default driver of `CacheLock` (`local`): no lock, always fills                 |
| `NoneCacheMetricsDriver`                                 | `.`           | the default driver of `CacheMetrics` (`none`): records nothing                     |
| `CountingCacheMetricsDriver`                             | `.`           | `counting`: counters per key owner in this process, `snapshot()`                   |
| `LoggerCacheMetricsDriver`                               | `.`           | `logger`: a `cache.load` and `cache.evict` debug line through `Logger`             |
| `CacheCounters`                                          | `.`           | type: one owner's counters in `snapshot()`                                         |
| `ValkeyCacheDriver`                                      | `./node`      | the `valkey` driver of `Cache`, for services                                       |
| `PostgresCacheDriver`                                    | `./node`      | the `postgres` driver of `Cache`, for services with no Valkey (on-prem)            |
| `CacheSql`                                               | `./contracts` | the port the `postgres` driver runs its statements on (@stackra/database binds it) |
| `postgresCacheTables`                                    | `./node`      | the statements that create its two unlogged tables, for the migration              |
| `WorkersCacheDriver`                                     | `./worker`    | the `workers` driver of `Cache`, for a web member on Cloudflare Workers            |

`Cache` is exported from `./contracts` only (one symbol, one entry; ADR 0294 decision 15).

## Caching a value

```ts
import { CacheKey } from "@stackra/cache";
import type { Cache } from "@stackra/cache/contracts";
import { Duration } from "@stackra/contracts";

export class ProductService extends CrudService<Product> {
  constructor(private readonly cache: Cache) {
    super();
  }

  view(id: PublicId<"prd">, locale: Locale): Promise<ProductView> {
    return this.cache.remember(CacheKey.of(Product, id, locale), Duration.minutes(10), () =>
      this.load(id, locale),
    );
  }
}

// in the action that changes the product: every locale's view goes
ctx.afterCommit(() => this.cache.forget(CacheKey.of(Product, product.id)));
```

- A key is `<ModelName>:<part>:<part>`, each part URI-encoded. `forget(key)` drops the key and every key that extends it
  by whole parts, so `CacheKey.of(Product, id)` covers `CacheKey.of(Product, id, locale)` but not
  `CacheKey.of(Product, id + "0")`.
- `remember` runs one load per key at a time: concurrent callers share it. A rejected load stores nothing. A load that a
  `put` or `forget` overtakes still answers its callers but is not stored, so a read that began before a change never
  caches the old value again.
- A cached **read** is the query's `cache:` option (ADR 0305 rule 31), not this port. A row read by its id is cached
  by the model trait `Cached({ ttl })` (@stackra/model, served by @stackra/database's `CrudService`). There is no
  `@Cached` decorator and no `ctx.cache`.
- Row changes evict without an action: @stackra/database's `CacheInvalidationService`, an outbox change consumer,
  forgets `CacheKey.of(Model, id)` in the shared namespace after every committed change of a `Cached` model's row, so
  a shared-namespace entry keyed under the row goes with it.

## Tags

A key groups entries by its own path; a tag groups them across owners. `put` and `remember` take `tags`, and
`forgetTag(tag)` drops every entry of the current namespace stored with that tag:

```ts
await this.cache.remember(
  CacheKey.of(Product, id, locale),
  Duration.minutes(10),
  () => this.load(id, locale),
  {
    tags: [CacheKey.of(Category, product.categoryId)],
  },
);

// when the category changes: every product view tagged with it goes
ctx.afterCommit(() => this.cache.forgetTag(CacheKey.of(Category, category.id)));
```

- A tag is a `CacheKey`, named after its owner like any key. Tags match exactly: `CacheKey.of(Category, id)` does not
  drop entries tagged `CacheKey.of(Category, id, "en")`.
- Tags live in the namespace: a `forgetTag` in one scope never reaches another's entries.
- A `remember` load in flight that carries the tag still answers its callers but is not stored.

## Stale-while-revalidate, one fill across instances, jitter

```ts
await this.cache.remember(CacheKey.of(PriceList, id), Duration.minutes(5), () => this.load(id), {
  stale: Duration.minutes(1), // after 5 minutes, answer the old list for up to 1 more while one call reloads it
  lock: true, // on a miss, one instance loads; the others wait for its value
});
```

- `stale`: an entry past its lifetime but inside the window is answered at once, and one background load per key
  replaces it. A failed reload leaves the stale entry; the first call past the window loads in the open. `get` never
  returns a stale value, and a `remember` without `stale` treats it as a miss.
- `lock`: with config `cache.lock: locks` (@stackra/locking's `LocksCacheLockDriver`), a miss runs the load on the
  instance that takes the fill lock; the others read the store every `fill.poll` for up to `fill.wait` (default 5 s,
  every 50 ms), then load themselves. A stale reload under `lock` runs on one instance only. The default `local` lock
  takes nothing, so single-flight stays per process; the memory and storage drivers ignore `lock`.
- `jitter` (0 to 1, default `0`): each lifetime is shortened at random by up to that fraction, so entries written
  together do not all expire together. `0.1` is a sensible value for a shared store.

## Metrics

`cache.metrics` picks the `CacheMetrics` driver. Every observation carries the key's owner (its first part, the class
`CacheKey.of` was given), never a key part, the namespace or the value.

| Name       | Driver                       | Records                                                                                         |
| ---------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `none`     | `NoneCacheMetricsDriver`     | nothing (default)                                                                               |
| `counting` | `CountingCacheMetricsDriver` | hits, stale hits, misses, loads, load milliseconds, evictions, by owner; read with `snapshot()` |
| `logger`   | `LoggerCacheMetricsDriver`   | one `cache.load` (owner, milliseconds) and `cache.evict` (owner, count) debug line each         |

An exporter (OTLP, a devtools panel) reads `snapshot()`; this package ships no vendor SDK.

## Namespaces

Every driver puts `CacheNamespace.current()` in front of each key, so two namespaces never read, write or forget each
other's entries. `cache.namespace` picks the `CacheNamespace` driver:

| Name     | Driver                                         | Namespace                                                        |
| -------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| `shared` | `SharedCacheNamespaceDriver` (default)         | `""` for every call                                              |
| `scope`  | `ScopeCacheNamespaceDriver` (`@stackra/scope`) | the running call's scope id; `""` for a platform call or no call |

A member with scopes sets `cache.namespace: "scope"`; otherwise the first `remember` shares entries across scopes. The
conformance test (`src/contracts/ports/__tests__/cache-namespace.conformance.test.ts`) runs every driver with two
namespaces over one store.

## Drivers

`cache.driver` picks the driver; the names are the driver file prefixes. Every driver scopes keys by
`CacheNamespace`, forgets a key with every key it covers and a tag with every entry carrying it, and runs one `remember`
load per key at a time in its process; `lock: true` shares one across instances through `CacheLock`.

| Driver     | Entry      | Where values live                                    | Config                                                              |
| ---------- | ---------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `memory`   | `.`        | this process, by reference; LRU past `maxEntries`    | `maxEntries` (default 10000)                                        |
| `storage`  | `.`        | the client storage `cache` area (`@stackra/storage`) | none; keys are `cache.` + the namespaced key                        |
| `valkey`   | `./node`   | a Valkey (Redis protocol) server shared by instances | secret `CACHE_VALKEY_URL`; `valkey.keyPrefix`                       |
| `postgres` | `./node`   | two unlogged tables in the service's own Postgres    | `postgres.schema` (default `cache`), `postgres.sweep` (default 100) |
| `workers`  | `./worker` | the Workers KV namespace bound by name               | `workers.binding` (default `CACHE`)                                 |

Every driver also reads `jitter`, `fill.wait` and `fill.poll`, and takes the `CacheLock` (`cache.lock`) and
`CacheMetrics` (`cache.metrics`) drivers.

- `memory` keeps values by reference, so treat what you read as immutable. The other drivers store JSON, so store plain
  data: a `Date` comes back as its string, a class instance as a plain object.
- Expiry is read from the `Clock` for every driver. The other drivers keep the expiry instant beside each value; the
  store's own expiry (the area's time-to-live, Valkey `PX`, KV `expirationTtl`) only reclaims space.
- `valkey`: the URL carries the password, so it is the `CACHE_VALKEY_URL` secret, never a config value; the driver
  refuses to start without it. Set `valkey.keyPrefix` per member when members share one server. Each write indexes the
  key in a sorted set `<keyPrefix>#k/<covering key>` under every key that covers it, and in `<keyPrefix>#t/<tag>` for
  each tag, scored with the instant the entry may go; a write drops members past their instant and keeps the set alive
  for its longest member. `forget` and `forgetTag` read one set: no `SCAN`, and no command touches two keys. A command is
  retried once and then rejects: when the server is down, the cache call fails rather than queueing.
- `postgres`: for an on-prem or air-gapped service with no Valkey (ADR 0150 decision 1, ADR 0076). Entries live in
  `<postgres.schema>.entries` and tag members in `<postgres.schema>.set_members`, both **unlogged**: no WAL, so writes
  are cheap, a crash empties them, and a read replica does not see them. Keys sort in the "C" collation, so `forget`'s
  prefix `like` (wildcards escaped) reads the primary key. Each entry write sweeps up to `postgres.sweep` dead rows
  (`0` leaves them). Statements run through the `CacheSql` port, which @stackra/database binds over the service's
  database, each on its own outside the caller's transaction, every value bound. `postgresCacheTables(schema)` gives
  the create statements and their inverses for the migration that makes the tables.
- `memory`, `storage`, `postgres` and `workers` list the keys under a prefix for `forget`, so they write no index; a tag's members
  are an in-memory set (`memory`) or one empty marker key per member under `#` that expires with its entry (`storage`,
  `workers`).
- `workers`: the KV namespace is found through `cloudflare:workers` by `workers.binding` when the driver is built, and a
  missing binding fails the boot. KV keeps a key at least 60 seconds, so a shorter lifetime ends on the clock instead.
  KV is eventually consistent: a write, a `forget` or a `forgetTag` reaches other locations within about a minute.
- A failure of the store (`storage`, `valkey`, `workers`) rejects the call; no driver falls back to the load or hides
  the error.

### No Encore cache driver

Encore's TypeScript SDK does ship a cache API (`encore.dev/storage/cache`: `CacheCluster`, `StringKeyspace` and the
other keyspaces, confirmed in the 1.58 types), but this package has no driver over it:

- A package never imports `encore.dev` (ADR 0124); an Encore driver would need a port that the generated Encore app
  binds to a cluster it declares, and gen's Encore target declares no cache cluster.
- An Encore keyspace deletes by exact key only and has no prefix scan, so `forget` would need the index sets the
  Valkey driver keeps, which an Encore keyspace has no type for.

A service on Encore that needs a shared cache uses the `valkey` driver, or `postgres` where no Valkey runs.

## Health check

`CacheHealthIndicatorDriver` (`.`) is this package's `HealthIndicator` driver, named `cache`: it reads one key that is never written. Bind it and
`@stackra/app`'s `/readyz` runs it with the other bound indicators. `health` in this package's config tunes it:

| Field      | Default | Meaning                                                                   |
| ---------- | ------- | ------------------------------------------------------------------------- |
| `timeout`  | `PT2S`  | How long the probe may take before it counts as failed.                   |
| `critical` | `true`  | A failed probe is `down` and fails `/readyz`; `false` reports `degraded`. |

A failed probe never throws; its detail names the error type only.
