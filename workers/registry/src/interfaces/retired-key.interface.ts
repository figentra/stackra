/**
 * Stackra file contract:
 * Purpose: `RetiredKey`: A rotated signing key: its SPKI DER in base64 and when it stopped signing.
 * Boundary: type only; the defaults live in wrangler.jsonc, never in code.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 19).
 */

/** A rotated signing key: its SPKI DER in base64 and when it stopped signing. */
export interface RetiredKey {
  readonly key: string;
  readonly expires: string;
}
