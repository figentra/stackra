/**
 * Stackra file contract:
 * Purpose: `WarehouseSyncOptions`, what one `WarehouseChangeSink.sync` run exports: which models, how many changes at
 *          most, and where and how the sink writes them.
 * Boundary: a type only; the caller (the app's scheduled job) reads every field from its settings.
 * Runtime: isomorphic
 * Governing contract: ADR 0163 and ADR 0190 (2026-10-29 amendments: the warehouse sink); ADR 0363 (no limits in source).
 */
import type { WarehouseWriteOptions } from "#contracts/types/warehouse-write-options.type";

/** Options of one warehouse sync run. */
export interface WarehouseSyncOptions extends WarehouseWriteOptions {
  /** The model class names (`Product`) whose changes are exported; never empty. */
  readonly models: readonly string[];

  /** The most changes one run reads from the change log; a whole number of at least 1. */
  readonly limit: number;
}
