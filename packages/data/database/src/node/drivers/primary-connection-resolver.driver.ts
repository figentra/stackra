/**
 * Stackra file contract:
 * Purpose: `PrimaryConnectionResolverDriver`, the free `ConnectionResolver`: every scope is served by
 *          `PRIMARY_CONNECTION`, the one pool of the service's database (one region, no cells yet).
 * Boundary: the default binding. A deployment with placed tenants binds `@stackra/tenancy`'s placement resolver
 *           instead; a Pro silo driver adds a database per tenant (ADR 0088 decision 3).
 * Runtime: node
 * Governing contract: ADR 0088 (decision 3); ADR 0186 (decision 6); stackra-310.
 */
import { Driver } from "@stackra/container";

import { PRIMARY_CONNECTION } from "#contracts/constants/primary-connection.constant";
import { ConnectionResolver } from "#contracts/ports/connection-resolver.port";

/**
 * One pool for every scope.
 *
 * @example
 * await new PrimaryConnectionResolverDriver().connectionOf(scope); // "primary"
 */
export class PrimaryConnectionResolverDriver extends Driver(ConnectionResolver) {
  /** Always `PRIMARY_CONNECTION`. */
  async connectionOf(): Promise<string> {
    return PRIMARY_CONNECTION;
  }
}
