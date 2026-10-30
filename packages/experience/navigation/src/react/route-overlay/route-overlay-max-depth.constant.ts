/**
 * Stackra file contract:
 * Purpose: `ROUTE_OVERLAY_MAX_DEPTH`, how many route overlays may stack on web: three (a record, a related record,
 *          one more step). A deeper one still opens, with a development warning, because the URL is the truth.
 * Boundary: a constant.
 * Runtime: browser
 * Governing contract: ADR 0317 amendment 2026-10-28 (stacked overlays, at most three).
 */

/** The deepest stack of route overlays the design allows. */
export const ROUTE_OVERLAY_MAX_DEPTH = 3;
