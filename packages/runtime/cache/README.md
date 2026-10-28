# @stackra/cache

Stackra cache: the `Cache` port for a cached value inside a service, driver or listener, `CacheKey.of` to build its
keys, the `CacheNamespace` port that keeps namespaces apart, the `CacheConfig` configuration, and the memory, storage,
Valkey and Workers KV drivers.

**Tier:** `tier:lib` (`packages/runtime/cache`). Entries `.`, `./contracts`, `./node` and `./worker`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`, `@stackra/storage`, zod and
`iovalkey` (`./node` only).

## What is here

| Symbol                        | Entry         | Use                                                                     |
| ----------------------------- | ------------- | ----------------------------------------------------------------------- |
| `Cache`                       | `./contracts` | the port: `get`, `put`, `remember`, `forget`                            |
| `CacheNamespace`              | `./contracts` | the port naming the current call's namespace, put in front of every key |
| `CacheKey`                    | `.`           | `CacheKey.of(Model, ...parts)`, the only maker of a key, and its type   |
| `CacheConfig`, `CacheConfig$` | `.`           | key `cache.cache`: the driver and each driver's settings (below)        |
| `CacheOptions`                | `.`           | the shape of `CacheConfig`                                              |
| `MemoryCacheDriver`           | `.`           | the `memory` driver of `Cache`                                          |
| `StorageCacheDriver`          | `.`           | the `storage` driver of `Cache`, for client targets                     |
| `SharedCacheNamespaceDriver`  | `.`           | the default driver of `CacheNamespace`: one shared namespace            |
| `ValkeyCacheDriver`           | `./node`      | the `valkey` driver of `Cache`, for services                            |
| `WorkersCacheDriver`          | `./worker`    | the `workers` driver of `Cache`, for a web member on Cloudflare Workers |

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
- A cached **read** is the query's `cache:` option (ADR 0305 rule 31), not this port. There is no `@Cached` and no
  `ctx.cache`.

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
`CacheNamespace`, forgets a key with every key it covers, and runs one `remember` load per key at a time in its process
(single-flight is not shared across instances).

| Driver    | Entry      | Where values live                                    | Config                                        |
| --------- | ---------- | ---------------------------------------------------- | --------------------------------------------- |
| `memory`  | `.`        | this process, by reference; LRU past `maxEntries`    | `maxEntries` (default 10000)                  |
| `storage` | `.`        | the client storage `cache` area (`@stackra/storage`) | none; keys are `cache.` + the namespaced key  |
| `valkey`  | `./node`   | a Valkey (Redis protocol) server shared by instances | secret `CACHE_VALKEY_URL`; `valkey.keyPrefix` |
| `workers` | `./worker` | the Workers KV namespace bound by name               | `workers.binding` (default `CACHE`)           |

- `memory` keeps values by reference, so treat what you read as immutable. The other drivers store JSON, so store plain
  data: a `Date` comes back as its string, a class instance as a plain object.
- Expiry is read from the `Clock` for every driver. The other drivers keep the expiry instant beside each value; the
  store's own expiry (the area's time-to-live, Valkey `PX`, KV `expirationTtl`) only reclaims space.
- `valkey`: the URL carries the password, so it is the `CACHE_VALKEY_URL` secret, never a config value; the driver
  refuses to start without it. Set `valkey.keyPrefix` per member when members share one server. `forget` walks
  `SCAN MATCH`, so it needs one endpoint, not cluster mode. A command is retried once and then rejects: when the server
  is down, the cache call fails rather than queueing.
- `workers`: the KV namespace is found through `cloudflare:workers` by `workers.binding` when the driver is built, and a
  missing binding fails the boot. KV keeps a key at least 60 seconds, so a shorter lifetime ends on the clock instead.
  KV is eventually consistent: a write or a `forget` reaches other locations within about a minute.
- A failure of the store (`storage`, `valkey`, `workers`) rejects the call; no driver falls back to the load or hides
  the error.

### No Encore cache driver

Encore's TypeScript SDK does ship a cache API (`encore.dev/storage/cache`: `CacheCluster`, `StringKeyspace` and the
other keyspaces, confirmed in the 1.58 types), but this package has no driver over it:

- A package never imports `encore.dev` (ADR 0124); an Encore driver would need a port that the generated Encore app
  binds to a cluster it declares, and gen's Encore target declares no cache cluster.
- An Encore keyspace deletes by exact key only and has no prefix scan, so `forget` could not drop the keys a key covers
  (`CacheKey.of(Product, id)` covering every locale's view) without a separate key index.

A service on Encore that needs a shared cache uses the `valkey` driver.

## Health check

`CacheHealthIndicatorDriver` (`.`) is this package's `HealthIndicator` driver, named `cache`: it reads one key that is never written. Bind it and
`@stackra/app`'s `/readyz` runs it with the other bound indicators. `health` in this package's config tunes it:

| Field      | Default | Meaning                                                                   |
| ---------- | ------- | ------------------------------------------------------------------------- |
| `timeout`  | `PT2S`  | How long the probe may take before it counts as failed.                   |
| `critical` | `true`  | A failed probe is `down` and fails `/readyz`; `false` reports `degraded`. |

A failed probe never throws; its detail names the error type only.
