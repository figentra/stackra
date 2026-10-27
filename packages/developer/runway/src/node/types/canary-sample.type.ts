/**
 * Stackra file contract:
 * Purpose: `CanarySample`, what the canary served since it started: requests and errors.
 * Boundary: type only; the caller reads it from observability for the canary's version and scopes, `canaryVerdict`
 *           judges it. Runway reads no metrics store itself.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 16 (point 4: health-gated promotion).
 */

/** The canary's traffic since it started. */
export type CanarySample = {
  readonly requests: number;
  readonly errors: number;
};
