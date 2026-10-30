/**
 * Stackra file contract:
 * Purpose: `SECONDARY_AXIS`, the Recharts `yAxisId` of a cartesian chart's second value axis, the one the series named
 *          in `secondaryKeys` read against.
 * Boundary: a constant; the first axis keeps Recharts' default id.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */

/** The second value axis' id. */
export const SECONDARY_AXIS = "secondary";
