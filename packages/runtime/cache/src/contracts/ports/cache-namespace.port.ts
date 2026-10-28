/**
 * Stackra file contract:
 * Purpose: the `CacheNamespace` port: names the namespace of the current call, which every `Cache` driver puts in
 *          front of each key, so values never cross from one namespace to another.
 * Boundary: an abstract class that is its own token. `SharedCacheNamespaceDriver` (one shared namespace) is the
 *           default; config `cache.namespace` selects another, such as @stackra/scope's `scope` driver, which names the
 *           call's scope id. This package names no tenant. Keyed `cache.CacheNamespace`.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2: keys are namespaced); ADR 0305 (rule 32: the port scopes keys); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

/**
 * Tells a cache which namespace the current call reads and writes.
 *
 * @example
 * export class ScopeCacheNamespaceDriver extends Driver(CacheNamespace) {
 *   current(): string {
 *     return (this.storage.current() as Partial<ExtensionContext> | undefined)?.scope?.id ?? "";
 *   }
 * }
 */
export abstract class CacheNamespace extends Port {
  /** Type-only port key, so `DriverName<CacheNamespace>` narrows to this port's drivers. */
  declare readonly "~key": "cache.CacheNamespace";

  /** The namespace of the current call; `""` is the shared namespace. Read on every cache call, so keep it cheap. */
  abstract current(): string;
}
