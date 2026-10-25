/**
 * Stackra file contract:
 * Purpose: `SeedRecord`, one document of a seed pack: a config record (`settings:product-default:returns`,
 *          `rule-set:commerce:returns`, `plan-catalogue:commerce`) with its kind, the profile folder and file it was
 *          read from, and its rows.
 * Boundary: a type only; `readSeedPack` builds it from `profiles/<profile>/*.yaml`.
 * Runtime: node
 * Governing contract: config-model section 6; ADR 0190 (decision 1).
 */
import type { SeedRow } from "#node/types/seed-row.type";

/** One seed record. */
export type SeedRecord = {
  /** One of `SEED_RECORD_KINDS`. */
  readonly kind: string;

  /** The record key the product reads it by. */
  readonly key: string;

  /** The profile folder it sits in (`minimal`, `demo`, `test`). */
  readonly profile: string;

  /** Its file, relative to the pack folder. */
  readonly file: string;

  /** Its rows, in file order. */
  readonly rows: readonly SeedRow[];
};
