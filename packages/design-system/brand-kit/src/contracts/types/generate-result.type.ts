/**
 * Stackra file contract:
 * Purpose: `GenerateResult`, what one generator run answers: the kit it read, the folder it wrote and every file it
 *          wrote there, sorted.
 * Boundary: type only. The CLI prints it as JSON with `--json`, which Runway's driver reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5).
 */

/** One run's record. */
export interface GenerateResult {
  /** The kit id. */
  readonly kit: string;

  /** The output folder, as given. */
  readonly out: string;

  /** The files written, relative to `out`, sorted. */
  readonly files: readonly string[];
}
