/**
 * Stackra file contract:
 * Purpose: `ProvisioningStatus`, where a managed resource is in its life: asked for, waiting on the provider's review
 *          (a 10DLC brand and campaign, a WhatsApp number), live, suspended, failed or removed. The tenant sees it.
 * Boundary: an `Enum.of` value plus the type of the same name; `Enum.meta(ProvisioningStatus, s).final` says whether a
 *           resource ever leaves the state. A provider's own states map to one of these in its `ManagedProvisioning`
 *           driver.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03 (create, verify, suspend, remove; status); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The states of a managed resource.
 *
 * @example
 * if (Enum.meta(ProvisioningStatus, resource.status).final) return;
 */
export const ProvisioningStatus = Enum.of({
  /** Asked for; nothing exists at the provider yet. */
  Requested: ["requested", { final: false }],
  /** Created at the provider and waiting on its review or approval. */
  Pending: ["pending", { final: false }],
  /** Live: a managed Connection may use it. */
  Active: ["active", { final: false }],
  /** Stopped for now (unpaid, a policy hold); it may be resumed. */
  Suspended: ["suspended", { final: false }],
  /** The provider refused it; a new request starts again. */
  Failed: ["failed", { final: true }],
  /** Removed at the provider. */
  Removed: ["removed", { final: true }],
});

/** One of the codes above. */
export type ProvisioningStatus = Enum.Value<typeof ProvisioningStatus>;
