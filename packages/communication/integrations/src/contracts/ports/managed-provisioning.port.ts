/**
 * Stackra file contract:
 * Purpose: `ManagedProvisioning`, the port a managed-provisioning workflow drives: create, verify, suspend and remove
 *          a per-tenant resource on Figentra's platform account, read its status, and read the cost events it ran up.
 * Boundary: an abstract class that is its own token, key `integrations.ManagedProvisioning`. A provider's driver does
 *           the provider's calls; the steps, their order and the waits are the `workflow-template:os:managed-
 *           provisioning:<category>` data, never code. Every method is safe to repeat: `create` by the request's
 *           reference, the rest by the resource id. A leaf file.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03; ADR 0294 (decision 16); config-model (flows in workflows).
 */
import { Port } from "@stackra/contracts";

import type { ManagedCostEvent } from "#contracts/types/managed-cost-event.type";
import type { ManagedResource } from "#contracts/types/managed-resource.type";
import type { ProvisioningRequest } from "#contracts/types/provisioning-request.type";

/**
 * Per-tenant resources on the platform account.
 *
 * @example
 * export class TwilioManagedProvisioningDriver extends Driver(ManagedProvisioning) { … }
 */
export abstract class ManagedProvisioning extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.ManagedProvisioning";

  /** Creates the resource `request` asks for, or returns the one its reference already made. */
  abstract create(request: ProvisioningRequest): Promise<ManagedResource>;

  /**
   * Reads the resource's state at the provider and records it: how a `pending` resource becomes `active` or `failed`.
   *
   * @throws NotFoundError when no resource has the id.
   */
  abstract verify(resourceId: string): Promise<ManagedResource>;

  /**
   * Stops the resource at the provider without removing it.
   *
   * @throws NotFoundError when no resource has the id.
   */
  abstract suspend(resourceId: string): Promise<ManagedResource>;

  /**
   * Removes the resource at the provider; its managed Connection stops working.
   *
   * @throws NotFoundError when no resource has the id.
   */
  abstract remove(resourceId: string): Promise<ManagedResource>;

  /** The resource as last recorded, or null. */
  abstract status(resourceId: string): Promise<ManagedResource | null>;

  /** The cost events the resource ran up at or after `since`, oldest first. */
  abstract costs(resourceId: string, since: Date): Promise<readonly ManagedCostEvent[]>;
}
