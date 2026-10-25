/**
 * Stackra file contract:
 * Purpose: `PlannedSeedRecord`, a seed record with the content hash it will be stored under, so the next run can tell
 *          an unchanged record from a changed one.
 * Boundary: a type only; `planSeed` adds the hash (`seedRecordHash`).
 * Runtime: node
 * Governing contract: config-model section 6; ADR 0325 (decision 7: seeds are resumable).
 */
import type { SeedRecord } from "#node/types/seed-record.type";

/** A seed record ready to write. */
export type PlannedSeedRecord = SeedRecord & {
  /** The SHA-256 of its kind, key and rows. */
  readonly hash: string;
};
