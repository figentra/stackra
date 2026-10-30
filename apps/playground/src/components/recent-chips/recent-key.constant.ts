/**
 * Stackra file contract:
 * Purpose: `RECENT_KEY`, the localStorage key of the recently viewed component paths (the palette and the home row
 *          share it).
 * Boundary: constants only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5 (RecentChip).
 */

/** Where the recent paths live, newest first. */
export const RECENT_KEY = "stackra-playground:recent";
