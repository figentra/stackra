/**
 * Stackra file contract:
 * Purpose: `MigrationFileStatus`, one compiled migration file in a `MigrationStatus`: its version and name, whether it
 *          is applied, and whether it was edited after it was applied.
 * Boundary: a type only; plain JSON values.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: the compiled stream); STA-2906.
 */

/** One compiled migration file. */
export interface MigrationFileStatus {
  /** The sequence number. */
  readonly version: number;
  /** The file name without `.up.sql`. */
  readonly name: string;
  /** Whether the recorded version has reached it. */
  readonly applied: boolean;
  /** Whether the history ledger recorded a different checksum for it: the frozen file was edited after it ran. */
  readonly edited: boolean;
}
