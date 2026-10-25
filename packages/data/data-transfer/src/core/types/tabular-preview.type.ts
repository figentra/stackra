/**
 * Stackra file contract:
 * Purpose: `TabularPreview`, the first rows of each sheet a preview read: what the mapping screen shows before commit.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */

/** The preview of a file. */
export interface TabularPreview {
  /** Each sheet read, in file order. */
  readonly sheets: readonly {
    /** The sheet name. */
    readonly name: string;
    /** Its header row. */
    readonly header: readonly string[];
    /** Its first data rows. */
    readonly rows: readonly (readonly string[])[];
  }[];
}
