/**
 * Stackra file contract:
 * Purpose: `SeedPlan`, what one seed run does, record by record: new records to insert, seed-owned records whose
 *          content changed to update, seed-owned records already current, and tenant-owned records it keeps.
 * Boundary: a type only; `planSeed` builds it. Only `insert` and `update` reach the runner.
 * Runtime: node
 * Governing contract: config-model sections 3 and 6.
 */
import type { PlannedSeedRecord } from "#node/types/planned-seed-record.type";

/** The plan of one seed run. */
export type SeedPlan = {
  /** Records the store does not hold yet. */
  readonly insert: readonly PlannedSeedRecord[];

  /** Seed-owned records whose content changed. */
  readonly update: readonly PlannedSeedRecord[];

  /** Seed-owned records already current, by `kind:key`. */
  readonly unchanged: readonly string[];

  /** Records a tenant changed, kept as they are, by `kind:key`. */
  readonly kept: readonly string[];
};
