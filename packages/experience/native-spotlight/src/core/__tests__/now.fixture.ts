/**
 * Stackra file contract:
 * Purpose: `NOW`, a test fixture: the fixed clock the visibility rule tests run at.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */

/** The fixtures' clock. */
export const NOW = new Date("2026-10-29T12:00:00.000Z");
