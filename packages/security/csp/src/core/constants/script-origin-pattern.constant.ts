/**
 * Stackra file contract:
 * Purpose: `SCRIPT_ORIGIN_PATTERN`, the grammar of a `thirdPartyScripts` key: one https origin with no wildcard, path,
 *          query, fragment or userinfo (`https://js.stripe.com`).
 * Boundary: the schema's check at boot; `allowedScripts` checks each origin again with `frameAncestorOrigin`. A script
 *           source is never a wildcard, a scheme or a host pattern: each third party is named exactly. Internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0298 (consent); STA-2562 frontend audit item (c).
 */

/** One https origin. */
export const SCRIPT_ORIGIN_PATTERN = /^https:\/\/[^\s;,'*/?#@]+$/;
