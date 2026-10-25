/**
 * Stackra file contract:
 * Purpose: `TabularReadOptions`, what a caller tells a `TabularReader`: the encoding or its fallback, the CSV
 *          delimiter, the sheets to read and the limits.
 * Boundary: a type only. `fallbackEncoding` is market-pack data (an Arabic market's legacy encoding); no encoding name
 *           other than the Unicode ones is written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 to 4).
 */
import type { TransferLimits } from "#contracts/types/transfer-limits.type";

/** Options of one read. */
export interface TabularReadOptions {
  /** A CSV file's encoding label; detected from its first bytes when absent. */
  readonly encoding?: string;

  /** The encoding used when a CSV file has no byte order mark and is not valid UTF-8 (from the market pack). */
  readonly fallbackEncoding?: string;

  /** A CSV file's delimiter; detected from its first line when absent. */
  readonly delimiter?: string;

  /** The sheets of a workbook to read, by name; every sheet when absent. A CSV file ignores it. */
  readonly sheets?: readonly string[];

  /** The ceilings of the read. */
  readonly limits?: TransferLimits;
}
