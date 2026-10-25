/**
 * Stackra file contract:
 * Purpose: `RateLimitScope`, what one of an Integration's `rateLimits` counts against: each credential the managed
 *          client actually uses, or every call to the provider together.
 * Boundary: an `Enum.of` value plus the type of the same name. The bucket key names the connection id (or `platform`
 *           for the Integration's own credentials), never a credential value.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13: the Integration declares its rate limits and the client applies them); ADR
 *                     0217 (token buckets).
 */
import { Enum } from "@stackra/contracts";

/**
 * The scopes of an outbound rate limit.
 *
 * @example
 * rateLimits: [{ requests: 10, per: "1s", by: RateLimitScope.Credential }]
 */
export const RateLimitScope = Enum.of({
  /** One bucket per credential used: each connection, and the platform's own credentials. */
  Credential: "credential",
  /** One bucket for every call to the provider from this deployment. */
  Integration: "integration",
});

/** One of the codes above. */
export type RateLimitScope = Enum.Value<typeof RateLimitScope>;
