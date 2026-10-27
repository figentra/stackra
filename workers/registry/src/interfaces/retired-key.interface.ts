/**
 * Stackra file contract:
 * Purpose: `RetiredKey`: A rotated signing key: its SPKI DER in base64 and when it stopped signing.
 * Boundary: type only; the defaults live in wrangler.jsonc, never in code.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 19).
 */

/** A rotated signing key: its SPKI DER in base64 and when it stopped signing. */
export interface RetiredKey {
  /** The public key as base64 SPKI DER. */
  readonly key: string;
  /** When the key stopped signing, as an ISO 8601 timestamp. */
  readonly expires: string;
}
