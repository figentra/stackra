/**
 * Stackra file contract:
 * Purpose: `TESTBED_SCALE_AFTER_MS`, how long every slot of a kind stays busy before its group grows by one.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0282 (decision 3).
 */

/** Two minutes. */
export const TESTBED_SCALE_AFTER_MS = 120_000;
