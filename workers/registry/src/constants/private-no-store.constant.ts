/**
 * Stackra file contract:
 * Purpose: `PRIVATE_NO_STORE`: the Cache-Control of anything licensed or token-bound (ADR 0453 decision 5).
 * Boundary: a constant only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 4).
 */

/** Cache-Control of anything licensed or token-bound (ADR 0453 decision 5). */
export const PRIVATE_NO_STORE = "private, no-store";
