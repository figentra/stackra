/**
 * Stackra file contract:
 * Purpose: `FawrySandboxConnection`, a FawryPay staging merchant: the same driver as `FawryConnection`, bound to the
 *          staging host's Integration.
 * Boundary: one connection class per Integration (ADR 0308 rule 2); it changes only the provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 2).
 */
import { FawryConnection } from "#core/providers/fawry/fawry.connection";

/**
 * A FawryPay staging merchant.
 *
 * @example
 * const connection = await store.find(FawrySandboxConnection);
 */
export class FawrySandboxConnection extends FawryConnection {
  /** The sandbox Integration's provider code. */
  override get provider(): string {
    return "fawry-sandbox";
  }
}
