/**
 * Stackra file contract:
 * Purpose: `CanaryVerdict`, what to do with a canary: `promote` it to everyone, `hold` it, or `rollback` (end it).
 * Boundary: type only; `canaryVerdict` decides it, `promoteCanary` acts on it.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 16 (point 4).
 */

/** The decision on one canary. */
export type CanaryVerdict = "promote" | "hold" | "rollback";
