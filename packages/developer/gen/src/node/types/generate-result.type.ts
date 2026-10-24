/**
 * Stackra file contract:
 * Purpose: `GenerateResult`, what one `generate` run did: its refusals, every file it produced, and the paths it
 *          wrote or, in a check run, found stale.
 * Boundary: a type only. When `errors` is not empty, `files` and `changed` are empty: nothing was written.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: `stackra gen --check`).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** What one run did. */
export interface GenerateResult {
  /** The refusals; when there is one, nothing was written. */
  readonly errors: readonly GenError[];

  /** Every file the run produced. */
  readonly files: readonly GeneratedFile[];

  /** The paths written (a write run) or that differ from disk (a check run). */
  readonly changed: readonly string[];
}
