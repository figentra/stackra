/**
 * Stackra file contract:
 * Purpose: `GENESIS_HASH`, the `previousHash` of the first link of every audit chain: 64 zeros.
 * Boundary: data only; the value every chain writer (OS audit, `@stackra/access-log`) starts from, so a bundle that
 *           begins at sequence 1 is anchored without a checkpoint.
 * Runtime: node
 * Governing contract: ADR 0212 (decision 3); ADR 0416.
 */

/** The hash before the first link. */
export const GENESIS_HASH = "0".repeat(64);
