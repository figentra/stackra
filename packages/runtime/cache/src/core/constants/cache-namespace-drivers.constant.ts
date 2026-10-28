/**
 * Stackra file contract:
 * Purpose: `CACHE_NAMESPACE_DRIVERS`, the driver names config `cache.namespace` may select for the `CacheNamespace`
 *          port: this package's `shared` (`SharedCacheNamespaceDriver`, the default) and `scope`, which
 *          `@stackra/scope` ships (`ScopeCacheNamespaceDriver`).
 * Boundary: the stand-in for the names gen derives from the driver files of the declared packages; the shipped schema's
 *           `namespace` enum and the `DriverRegistry` entry are both read from it. A host with its own driver extends
 *           its generated schema. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a driver choice is a config field typed `DriverName<Port>`); ADR 0150
 *                     (decision 2); STA-1442.
 */

/** The `CacheNamespace` drivers, by name. */
export const CACHE_NAMESPACE_DRIVERS = ["shared", "scope"] as const;
