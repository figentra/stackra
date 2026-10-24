/**
 * Stackra file contract:
 * Purpose: the `CacheNamespace` port: names the namespace of the current call, which every `Cache` driver puts in
 *          front of each key, so values never cross from one namespace to another.
 * Boundary: an abstract class that is its own token. `SharedCacheNamespaceDriver` (one shared namespace) is the
 *           default; the tenancy package binds the driver that names the call's scope. This package names no tenant.
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
 *     return this.scope.current().id;
 *   }
 * }
 */
export abstract class CacheNamespace extends Port {
  /** The namespace of the current call; `""` is the shared namespace. Read on every cache call, so keep it cheap. */
  abstract current(): string;
}
