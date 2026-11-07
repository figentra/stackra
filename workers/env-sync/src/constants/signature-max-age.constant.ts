/**
 * Stackra file contract:
 * Purpose: how far a webhook's signed timestamp may be from now before the call is refused as a replay.
 * Boundary: a constant only; signature-valid.ts reads it.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6).
 */

/** Five minutes, in milliseconds. */
export const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;
