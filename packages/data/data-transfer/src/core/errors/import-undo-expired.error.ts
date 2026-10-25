/**
 * Stackra file contract:
 * Purpose: `ImportUndoExpiredError` (`import_undo_expired`), the refusal to revert a run that settled before the undo
 *          window the caller read from its settings.
 * Boundary: a failed-precondition refusal (412), never retryable. Its details are the run id and when it settled.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 8); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The run is past its undo window. */
export class ImportUndoExpiredError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The run id. */
  runId!: string;

  /** When the run settled, ISO 8601. */
  settledAt!: string;
}
