/**
 * Stackra file contract:
 * Purpose: `Platform`: `react` is the web entry (`/react`), `native` the React Native entry (`/native`).
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2; ADR 0305 (one declaration per file).
 */

/** The platforms an entry can ship on. */
export const Platform = Object.freeze(["react", "native"] as const);

/** One component platform. */
export type Platform = (typeof Platform)[number];
