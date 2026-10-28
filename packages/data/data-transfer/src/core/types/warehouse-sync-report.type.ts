/**
 * Stackra file contract:
 * Purpose: `WarehouseSyncReport`, what one `WarehouseChangeSink.sync` run did: how many changes it exported and where.
 * Boundary: a type only; counts and file keys, never row values.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink).
 */

/** The result of one warehouse sync run. */
export interface WarehouseSyncReport {
  /** The changes exported; 0 when the change log had nothing new. */
  readonly records: number;

  /** Where each batch was written, in write order. */
  readonly files: readonly string[];
}
