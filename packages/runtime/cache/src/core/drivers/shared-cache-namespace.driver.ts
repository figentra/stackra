/**
 * Stackra file contract:
 * Purpose: the default driver of the `CacheNamespace` port: one shared namespace for every call, for a member with no
 *          scopes.
 * Boundary: returns `""` always. A member with scopes binds the tenancy package's driver instead, so its keys are
 *           prefixed with the call's scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2); ADR 0266 (one default driver).
 */
import { Driver } from "@stackra/container";

import { CacheNamespace } from "#contracts/ports/cache-namespace.port";

/** Puts every call in the one shared namespace. */
export class SharedCacheNamespaceDriver extends Driver(CacheNamespace) {
  /** The shared namespace, `""`. */
  current(): string {
    return "";
  }
}
