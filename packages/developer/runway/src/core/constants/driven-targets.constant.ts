/**
 * Stackra file contract:
 * Purpose: `DRIVEN_TARGETS`, the destinations runway has a driver for (`encore-cloud`, `cloudflare-workers`, `eas`,
 *          `mintlify`), and the target blocks a root runway may still hold without being a destination: `npm` (the
 *          release workflow's registry publish) and `electron-release` (the desktop update feed's origin, read at
 *          build time by `definesFor`, never shipped to).
 * Boundary: a frozen record of names. A driver added to `runwayProviders` adds its destination here (owner decision
 *           O8, 2026-11-04: an undriven target is removed until a product needs it).
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 1: one provider per destination); STA-2100.
 */

/** The driven destinations and the non-destination target blocks. */
export const DRIVEN_TARGETS = Object.freeze({
  destinations: Object.freeze(["encore-cloud", "cloudflare-workers", "eas", "mintlify"]),
  blocks: Object.freeze(["npm", "electron-release"]),
});
