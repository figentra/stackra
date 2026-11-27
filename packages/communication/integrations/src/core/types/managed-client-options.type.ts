/**
 * Stackra file contract:
 * Purpose: `ManagedClientOptions`, what `managedClient` needs to call a provider for one credential set: the
 *          Integration, the connection when it is not the platform's own credentials, the secret store, the rate-limit
 *          store, the clock, for an OAuth integration the source of a fresh access token, and the circuit breaker and
 *          bulkhead of an origin, which the runtime keeps across clients.
 * Boundary: a type only, internal: `IntegrationRuntime#client` builds it. Without `guardsOf` a client sheds nothing
 *           and keeps only its per-attempt timeout.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 4, 7 and 13); STA-1467 (circuit breaker and bulkhead).
 */
import type { RateLimitStore } from "@stackra/actions/contracts";
import type { SecretStore } from "@stackra/config/contracts";
import type { Bulkhead, CircuitBreaker, Clock } from "@stackra/contracts";

import type { Connection } from "#core/bases/connection.base";
import type { Integration } from "#core/bases/integration.base";

/** The inputs of one managed client. */
export interface ManagedClientOptions {
  /** The Integration: its options, its plain fields and its `@Secret` names. */
  readonly integration: Integration;

  /** The connection whose credentials are used; the platform's own when absent. */
  readonly connection?: Connection;

  /** Resolves the Integration's `@Secret` fields by name. */
  readonly secrets: SecretStore;

  /** Holds the rate-limit buckets. */
  readonly limits: RateLimitStore;

  /** Tells the time for buckets, token expiry, JWT claims and the circuit breaker. */
  readonly clock: Clock;

  /** A fresh access token, for the two OAuth types. */
  readonly accessToken?: () => Promise<string>;

  /**
   * The circuit breaker and the bulkhead an attempt to `origin` (`https://api.resend.com`) goes through, each absent
   * when the Integration turns it off; the runtime keeps one of each per Integration and origin, so every client of
   * the provider shares them.
   */
  readonly guardsOf?: (origin: string) => {
    readonly breaker?: CircuitBreaker;
    readonly bulkhead?: Bulkhead;
  };
}
