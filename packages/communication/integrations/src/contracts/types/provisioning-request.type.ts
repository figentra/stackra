/**
 * Stackra file contract:
 * Purpose: `ProvisioningRequest`, what a managed-provisioning workflow asks `ManagedProvisioning.create` for: one
 *          per-tenant resource of a provider category on the platform account, under an idempotency reference.
 * Boundary: a type only. `details` are the provider's own inputs (a brand's legal name, a sending domain), taken from
 *           the tenant's records by the workflow; never a secret.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03; config-model (flows in workflows).
 */
import type { ScopeRef } from "@stackra/contracts";

/**
 * One resource asked for.
 *
 * @example
 * await provisioning.create({ reference: "prov_1", category: "messaging", provider: "twilio", scope, details: {} });
 */
export interface ProvisioningRequest {
  /** The request's own id; asking again with it returns the same resource. */
  readonly reference: string;

  /** The provider category (`messaging`, `payments`), a `provider-category` record's name. */
  readonly category: string;

  /** The Integration's provider code. */
  readonly provider: string;

  /** The scope node the resource is for. */
  readonly scope: ScopeRef;

  /** The provider's inputs, as data. */
  readonly details: Readonly<Record<string, unknown>>;
}
