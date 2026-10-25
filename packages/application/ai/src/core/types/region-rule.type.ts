/**
 * Stackra file contract:
 * Purpose: `RegionRule`, the product's routing rule for one data region: the jurisdictions a call may fall back to,
 *          with disclosure, when no model serves the region, and the jurisdictions never used without the tenant's
 *          opt-in.
 * Boundary: a type only; product data per region. No fallback means in-region only. A tenant may always choose strict
 *           in-region on the request, which ignores the fallback.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 14); ADR 0353 (a region fixed at sign-up).
 */

/** One region's rule. */
export interface RegionRule {
  /** The data region (`me`). */
  readonly region: string;

  /** The jurisdictions tried in order when no model serves the region; each use is disclosed. */
  readonly fallback: readonly string[];

  /** The fallback jurisdictions used only when the tenant opted in. */
  readonly optInRequired: readonly string[];
}
