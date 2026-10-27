/**
 * Stackra file contract:
 * Purpose: `IMMUTABLE`: the Cache-Control of an open tarball (ADR 0453 decision 5).
 * Boundary: a constant only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 4).
 */

/** Cache-Control of an open tarball (ADR 0453 decision 5). */
export const IMMUTABLE = "public, max-age=31536000, immutable";
