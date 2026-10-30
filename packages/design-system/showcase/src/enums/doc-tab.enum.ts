/**
 * Stackra file contract:
 * Purpose: `DocTab`, the four swipeable tab pages of the mobile component screen (and the `?tab=` deep-link value).
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4; ADR 0305 (one declaration per file).
 */

/** The mobile component screen tabs, in order. */
export const DocTab = Object.freeze(["preview", "usage", "api", "docs"] as const);

/** One mobile component screen tab. */
export type DocTab = (typeof DocTab)[number];
