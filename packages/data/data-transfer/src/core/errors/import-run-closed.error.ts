/**
 * Stackra file contract:
 * Purpose: `ImportRunClosedError` (`import_run_closed`), the refusal to run a finished or reverted import again, or to
 *          revert a run that is still running or already reverted.
 * Boundary: a conflict refusal (409), never retryable. Its details are the run id and its state.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 and 8); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The run is in a state that does not allow the call. */
export class ImportRunClosedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The run id. */
  runId!: string;

  /** The run's state (`finished`). */
  state!: string;
}
