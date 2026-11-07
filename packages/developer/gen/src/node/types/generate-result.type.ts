/**
 * Stackra file contract:
 * Purpose: `GenerateResult`, what one `generate` run did: its refusals, every file it produced, the paths it
 *          wrote or, in a check run, found stale, and its warnings.
 * Boundary: a type only. When `errors` is not empty, `files` is empty and `changed` lists only the client files and
 *           manifest a refused run may still write (never in a check run).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: `stackra gen --check`); ADR 0101 (Enforcement: gen warns).
 */
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** What one run did. */
export interface GenerateResult {
  /** The refusals; when there is one, nothing was written but the client files and manifest listed in `changed`. */
  readonly errors: readonly GenError[];

  /** The full pass's warnings (`severity: "warning"`), which never block writing; absent when none was reported. */
  readonly warnings?: readonly GenError[];

  /** Every file the run produced. */
  readonly files: readonly GeneratedFile[];

  /** The paths written (a write run) or that differ from disk (a check run). */
  readonly changed: readonly string[];

  /**
   * What gen notes without refusing, such as `client_event_unsubscribed` (STA-1910); absent when none. A run with
   * warnings still writes.
   */
  readonly warnings?: readonly GenError[];
}
