/**
 * Stackra file contract:
 * Purpose: `ScopeCacheNamespaceDriver`, the `scope` driver of @stackra/cache's `CacheNamespace` port: the namespace of
 *          a cache call is the id of the scope node the running call acts in, so two scopes never share an entry.
 * Boundary: reads the running call's context through @stackra/actions' `ContextStorage` and answers its `scope.id`
 *           (stable across a subtree move, unlike the path). A call with no scope (a platform call) and code outside
 *           every call (the `/readyz` probe) answer `""`, the shared namespace, which no scope id equals. It checks
 *           nothing: the pipeline resolved and checked the scope before the call ran. Selected by
 *           `cache.namespace: "scope"`.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2: keys are namespaced, and its enforcement); ADR 0305 (rule 32); ADR 0327
 *                     (decision 6: the current scope); ADR 0323 (R-59: named after the scope).
 */
import type { ExtensionContext } from "@stackra/actions";
import type { ContextStorage } from "@stackra/actions/contracts";
import { CacheNamespace } from "@stackra/cache/contracts";
import { Driver } from "@stackra/container";

/**
 * Namespaces the cache by the running call's scope.
 *
 * @example
 * // runway or a host's CacheConfig: cache.namespace = "scope"
 * new ScopeCacheNamespaceDriver(storage).current(); // "scp_01j9z3k4m5n6p7q8r9s0t1v2w0" inside a scoped call
 */
export class ScopeCacheNamespaceDriver extends Driver(CacheNamespace) {
  /** Where the pipeline keeps the running call's context. */
  private readonly storage: ContextStorage;

  /**
   * @param storage - the storage the action pipeline runs each call in.
   */
  constructor(storage: ContextStorage) {
    super();
    this.storage = storage;
  }

  /** The running call's scope id, or `""` (shared) for a platform call or outside every call. */
  current(): string {
    const context = this.storage.current() as Partial<ExtensionContext> | undefined;
    return context?.scope?.id ?? "";
  }
}
