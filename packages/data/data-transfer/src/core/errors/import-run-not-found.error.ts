/**
 * Stackra file contract:
 * Purpose: `ImportRunNotFoundError` (`import_run_not_found`), the refusal to revert a run the ledger does not know.
 * Boundary: a not-found refusal (404), never retryable. Its detail is the run id.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 8); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** No such import run. */
export class ImportRunNotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {
  /** The run id. */
  runId!: string;
}
