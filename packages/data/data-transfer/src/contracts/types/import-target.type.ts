/**
 * Stackra file contract:
 * Purpose: `ImportTarget`, what a model supplies to be importable: the schema a mapped row must pass, an `upsert` of one
 *          batch by import key, and a `revert` of the changes a run wrote.
 * Boundary: a type the consumer implements (the `@Importable` integration of ADR 0163 generates it). `upsert` runs one
 *           batch in one unit of work, so a batch that throws writes nothing, and it must be idempotent by key so a
 *           resumed run can repeat a batch. `revert` restores before-images, deletes records the run created, and
 *           refuses a record changed since the import.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 6 to 8); ADR 0163 (decision 3).
 */
import type { ZodType } from "zod";

import type { ImportChange } from "#contracts/types/import-change.type";

/** An importable model. */
export interface ImportTarget<T> {
  /** The schema a mapped row (field name to cell text) must pass; it coerces text to the field types. */
  readonly schema: ZodType<T>;

  /** Writes one batch and returns each written record's key and before-image. */
  upsert(records: readonly T[]): Promise<readonly ImportChange[]>;

  /** Reverts the changes of one batch. */
  revert(changes: readonly ImportChange[]): Promise<void>;
}
