/**
 * Stackra file contract:
 * Purpose: `TabularSheet`, one named sheet a `TabularWriter` writes: its rows, the first of which is the header.
 * Boundary: a type only; the rows are streamed, so an export never builds the whole sheet in memory.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 2).
 */
import type { TabularCell } from "#contracts/types/tabular-cell.type";

/** A sheet to write. */
export interface TabularSheet {
  /** The sheet name (a CSV file has no sheet name and ignores it). */
  readonly name: string;

  /** The rows in order, header first. */
  readonly rows: AsyncIterable<readonly TabularCell[]> | Iterable<readonly TabularCell[]>;
}
