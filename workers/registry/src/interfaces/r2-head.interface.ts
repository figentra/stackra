/**
 * Stackra file contract:
 * Purpose: `R2Head`: an R2 object's metadata.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */

/** An R2 object's metadata. */
export interface R2Head {
  readonly size: number;
  readonly customMetadata?: Record<string, string> | undefined;
}
