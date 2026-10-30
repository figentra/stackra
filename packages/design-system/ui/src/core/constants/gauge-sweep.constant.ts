/**
 * Stackra file contract:
 * Purpose: `GAUGE_SWEEP`, the arc a gauge draws: three quarters of a ring, open at the bottom, from 225 degrees
 *          (clockwise from twelve o'clock) through the top to 135.
 * Boundary: values only; web and native read the same numbers.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */

/** The gauge's start angle and sweep, in degrees clockwise from the top. */
export const GAUGE_SWEEP = { start: -135, sweep: 270 } as const;
