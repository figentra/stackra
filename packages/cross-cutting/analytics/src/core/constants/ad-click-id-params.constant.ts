/**
 * Stackra file contract:
 * Purpose: `AD_CLICK_ID_PARAMS`, the landing-URL query parameters the ad platforms put their click id in: Meta
 *          `fbclid`, TikTok `ttclid`, Google Ads `gclid`, Snap `ScCid`.
 * Boundary: data only; `adClickIdOf`'s default. A host passes its own list when a Connection uses another parameter.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 1); analytics gap 12 (stackra-412).
 */

/** The click id parameters, in the order they are looked for. */
export const AD_CLICK_ID_PARAMS: readonly string[] = ["fbclid", "ttclid", "gclid", "ScCid"];
