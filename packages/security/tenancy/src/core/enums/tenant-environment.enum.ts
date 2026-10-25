/**
 * Stackra file contract:
 * Purpose: `TenantEnvironment`, which environment a tenant is: the live tenant customers use, or a sandbox tenant a
 *          live tenant tries structural changes in before promoting them.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are stored on memberships and sandbox records, so
 *           a code never changes. The environment banner (`@stackra/panel`) reads it; it grants nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decisions 1 and 5); ADR 0210 (decision 8: sandbox tenants); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The environments of a tenant. */
export const TenantEnvironment = Enum.of({
  /** The tenant customers use. */
  Live: "live",
  /** A copy of a live tenant's configuration for trying structural changes; promoted to live after review. */
  Sandbox: "sandbox",
});

/** One of the codes above. */
export type TenantEnvironment = Enum.Value<typeof TenantEnvironment>;
