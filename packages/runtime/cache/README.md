# @stackra/cache

Stackra cache: the `Cache` port for a cached value inside a service, driver or listener, `CacheKey.of` to build its
keys, the `CacheNamespace` port that keeps namespaces apart, the `CacheConfig` configuration, and the memory driver.

**Tier:** `tier:lib` (`packages/runtime/cache`). Entries `.` and `./contracts`. Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/validation`, `@stackra/config` and zod.

## What is here

| Symbol                        | Entry         | Use                                                                     |
| ----------------------------- | ------------- | ----------------------------------------------------------------------- |
| `Cache`                       | `./contracts` | the port: `get`, `put`, `remember`, `forget`                            |
| `CacheNamespace`              | `./contracts` | the port naming the current call's namespace, put in front of every key |
| `CacheKey`                    | `.`           | `CacheKey.of(Model, ...parts)`, the only maker of a key, and its type   |
| `CacheConfig`, `CacheConfig$` | `.`           | key `cache.cache`: `maxEntries` (memory driver bound, default 10000)    |
| `CacheOptions`                | `.`           | the shape of `CacheConfig`                                              |
| `MemoryCacheDriver`           | `.`           | the driver of `Cache`: process memory, LRU, clock expiry, single-flight |
| `SharedCacheNamespaceDriver`  | `.`           | the default driver of `CacheNamespace`: one shared namespace            |

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
other's entries. `SharedCacheNamespaceDriver` names one shared namespace; the tenancy package binds the driver that
names the call's scope.

## Drivers

Only the memory driver ships today. It keeps values by reference, so treat what you read as immutable, and keeps at
most `maxEntries`, dropping the least recently read first. Network drivers (Valkey, Encore, Workers, storage) serialise
values; store plain data.
