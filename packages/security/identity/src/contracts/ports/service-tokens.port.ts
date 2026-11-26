/**
 * Stackra file contract:
 * Purpose: the `ServiceTokens` port: this service's own access token for a target audience (the receiving product's
 *          project), which an outgoing service-to-service call sends as `Authorization: Bearer` (ADR 0209 decision 3).
 * Boundary: an abstract class that is its own token, keyed `identity.ServiceTokens`. A driver signs in as this
 *           service's own service account (one per service) and may keep a token until shortly before it expires;
 *           `MemoryServiceTokensDriver` serves tests. A token and the key behind it are never logged and never put in
 *           an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, point 1: the service token); STA-2558.
 */
import { Port } from "@stackra/contracts";

/**
 * Answers this service's access tokens.
 *
 * @example
 * const token = await serviceTokens.for("312909075212468632"); // the receiving product's project id
 * headers.Authorization = `Bearer ${token}`;
 */
export abstract class ServiceTokens extends Port {
  /** Type-only port key, so `DriverName<ServiceTokens>` narrows to this port's drivers. */
  declare readonly "~key": "identity.ServiceTokens";

  /**
   * This service's access token, issued for `audience`.
   *
   * @throws Error when no token can be had (an issuer outage, a missing key); the call then fails, never goes out
   *         unauthenticated.
   */
  abstract for(audience: string): Promise<string>;
}
