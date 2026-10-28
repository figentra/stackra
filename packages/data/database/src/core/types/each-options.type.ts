/**
 * Stackra file contract:
 * Purpose: `EachOptions`, what `Repository.each(where, options)` and `chunk(where, options)` take: the batch size of
 *          each keyset read, plus the hidden-row switches (`withDeleted`, `onlyArchived`).
 * Boundary: a type only. `batch` is a whole number from 1 to `BULK_LIMITS.maxBatch` (500 when absent).
 * Runtime: node
 * Governing contract: data-layer gaps mo9 and mo14 (stackra-280); ADR 0134 (decision 4).
 */
import type { DeletedReadOptions } from "#core/types/deleted-read-options.type";

/** The walk options. */
export interface EachOptions extends DeletedReadOptions {
  /** How many rows one read takes. */
  readonly batch?: number;
}
