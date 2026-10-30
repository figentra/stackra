/**
 * Stackra file contract:
 * Purpose: `ComponentTier`: `free` is `@stackra/ui`, the only tier core registers; `pro` is kept
 *          so the stackra-pro showcase (ADR 0461) can register its own entries on the same shape.
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2; ADR 0305 (one declaration per file).
 */

/** The component tiers an entry can belong to. */
export const ComponentTier = Object.freeze(["free", "pro"] as const);

/** One component tier. */
export type ComponentTier = (typeof ComponentTier)[number];
