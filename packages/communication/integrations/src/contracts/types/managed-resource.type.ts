/**
 * Stackra file contract:
 * Purpose: `ManagedResource`, one per-tenant resource on Figentra's platform account (a Twilio subaccount, a Stripe
 *          connected account, a sending domain) and where it is: the record a managed Connection points at by
 *          `resourceId`, and what the tenant's status screen shows.
 * Boundary: a type only; `ManagedProvisioning` returns it. `providerRef` is the provider's id of the resource, never a
 *           credential; a key the provider issues for it goes into the managed Connection's `@Secret` field.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03; ADR 0308 (rule 20: no credential outside the store).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { ProvisioningStatus } from "#contracts/enums/provisioning-status.enum";

/**
 * A managed resource.
 *
 * @example
 * if (resource.status === ProvisioningStatus.Active) await store.connect(type, { fields, source, resourceId });
 */
export interface ManagedResource {
  /** The resource's id here, the `resourceId` of its managed Connection. */
  readonly id: string;

  /** The request reference that made it. */
  readonly reference: string;

  /** The provider category. */
  readonly category: string;

  /** The Integration's provider code. */
  readonly provider: string;

  /** The scope node it serves. */
  readonly scope: ScopeRef;

  /** Where it is. */
  readonly status: ProvisioningStatus;

  /** The provider's id of it, once it exists there. */
  readonly providerRef?: string;

  /** The provider's short reason for a `failed` or `suspended` state, shown to the tenant. */
  readonly reason?: string;

  /** When the status last changed. */
  readonly updatedAt: Date;
}
