/**
 * Stackra file contract:
 * Purpose: `DatevWriteOptions`, what `DatevAsciiWriterDriver` needs beyond the rows: the `[Allgemein]` entries (the
 *          profile's, with the tenant's consultant and client numbers merged in), the record table and record number.
 * Boundary: a type only; `datevWriteOptionsOf` builds it from a profile and the tenant's entries.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4).
 */
import type { TabularWriteOptions } from "#contracts/types/tabular-write-options.type";

/** Options of one DATEV ASCII write. */
export interface DatevWriteOptions extends TabularWriteOptions {
  /** The `[Allgemein]` entries, in order (`Ziel`, `Version_SST`, `BeraterNr`, `MandantenNr`, ...). */
  readonly general: Readonly<Record<string, string>>;

  /** The record description's table (`u_lod_bwd_buchung_standard`). */
  readonly recordTable: string;

  /** The record number that starts the description and every data line. */
  readonly recordNumber: number;
}
