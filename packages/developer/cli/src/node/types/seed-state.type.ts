/**
 * Stackra file contract:
 * Purpose: `SeedState`, what the member's seed runner reports for one record already stored: who owns its current
 *          value (the seed, or the tenant who changed it) and the content hash of the seed revision it holds.
 * Boundary: a type only; the runner reads it from its own store. The CLI plans from it and never reads a database.
 * Runtime: node
 * Governing contract: config-model sections 3 and 6 (a new seed version never overwrites a tenant value).
 */

/** One stored seed record. */
export type SeedState = {
  /** The record kind. */
  readonly kind: string;

  /** The record key. */
  readonly key: string;

  /** `seed` while the value is the product default; `tenant` once a tenant changed it. */
  readonly owner: "seed" | "tenant";

  /** The hash of the seeded content it holds. */
  readonly hash: string;
};
