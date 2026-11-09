/**
 * Stackra file contract:
 * Purpose: `OrganizationPolicy`, one organization policy (SCP, RCP or tag policy) and the root, units or accounts it
 *          attaches to.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172, ADR 0524.
 */

/** One organization policy. */
export interface OrganizationPolicy {
  /** `SERVICE_CONTROL_POLICY`, `RESOURCE_CONTROL_POLICY`, `TAG_POLICY`, … */
  readonly type: string;
  /** The description AWS shows for the policy. */
  readonly description?: string;
  /** The document, as an object or the exact JSON text (kept byte for byte, which an imported policy needs). */
  readonly content: object | string;
  /** `root`, a unit path (`Workloads/me`) or a 12-digit account id. */
  readonly targets: readonly string[];
}
