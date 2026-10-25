/**
 * Stackra file contract:
 * Purpose: `ManagedClientOptions`, what `managedClient` needs to call a provider for one credential set: the
 *          Integration, the connection when it is not the platform's own credentials, the secret store, the rate-limit
 *          store, the clock and, for an OAuth integration, the source of a fresh access token.
 * Boundary: a type only, internal: `IntegrationRuntime#client` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 4, 7 and 13).
 */
import type { RateLimitStore } from "@stackra/actions/contracts";
import type { SecretStore } from "@stackra/config/contracts";
import type { Clock } from "@stackra/contracts";

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

  /** Tells the time for buckets, token expiry and JWT claims. */
  readonly clock: Clock;

  /** A fresh access token, for the two OAuth types. */
  readonly accessToken?: () => Promise<string>;
}
