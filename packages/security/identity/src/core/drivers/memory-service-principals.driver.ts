/**
 * Stackra file contract:
 * Purpose: `MemoryServicePrincipalsDriver`, a `ServicePrincipals` over principals held in memory, for tests and local
 *          runs.
 * Boundary: process-local; never a production store (the identity service's, over the principals the OS seeds). Holds
 *           no principal until `seed`, so the container builds it with no arguments.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3); ADR 0263 (a driver is named by its class: `memory`); STA-2558.
 */
import { Driver } from "@stackra/container";

import { ServicePrincipals } from "#contracts/index";
import type { ServicePrincipal } from "#contracts/index";

/**
 * Service principals in memory.
 *
 * @example
 * const principals = new MemoryServicePrincipalsDriver().seed({
 *   "312909075212468632": { id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w3", key: "ship.shipping", scopeId },
 * });
 */
export class MemoryServicePrincipalsDriver extends Driver(ServicePrincipals) {
  /** Token subject to its principal. */
  private principals = new Map<string, ServicePrincipal>();

  /**
   * Sets the principals this store knows by subject, replacing any before.
   *
   * @returns this store, to chain.
   */
  seed(principals: Readonly<Record<string, ServicePrincipal>>): this {
    this.principals = new Map(Object.entries(principals));
    return this;
  }

  /** Implements `ServicePrincipals.bySubject`, documented there. */
  bySubject(subject: string): Promise<ServicePrincipal | undefined> {
    return Promise.resolve(this.principals.get(subject));
  }
}
