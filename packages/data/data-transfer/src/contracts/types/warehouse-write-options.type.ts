/**
 * Stackra file contract:
 * Purpose: `WarehouseWriteOptions`, where a `WarehouseSink` writes a batch and how large its row groups are.
 * Boundary: a type only; the caller reads both from its settings (configuration, not code).
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink); ADR 0363 (no limits in source).
 */

/** Options of one warehouse write. */
export interface WarehouseWriteOptions {
  /** The key prefix on the disk the files go under (`warehouse`); `""` writes at the disk's root. */
  readonly prefix: string;

  /** The rows per Parquet row group; the whole batch is one row group when absent. */
  readonly rowGroupRows?: number;
}
