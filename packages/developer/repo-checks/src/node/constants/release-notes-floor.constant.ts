/**
 * Stackra file contract:
 * Purpose: `RELEASE_NOTES_FLOOR`, the first `@stackra/*` release whose breaks must each have a written upgrade note:
 *          0.30.0, the first breaking minor after consumers pinned `@stackra/*` from the registry. Earlier breaks are
 *          history; their changelog entries are the only record.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); STA-2835.
 */

/** Breaks released before this version need no upgrade note. */
export const RELEASE_NOTES_FLOOR = "0.30.0";
