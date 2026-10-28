/**
 * Stackra file contract:
 * Purpose: `AppendOnlyWriteError`, the refusal of a change to a row of an `AppendOnly` model (a ledger entry, an audit
 *          record): its rows are inserted and never updated; a correction is a new row.
 * Boundary: a refusal (`failed_precondition`, not retryable): the write is wrong, not the moment. `model` is the entity
 *           name and `operation` the write that was refused (`update`, `increment`, `delete`, `restore`, `repath`).
 *           Removing rows for retention or erasure (`purge`, `forceDelete`) is not refused here.
 * Runtime: node
 * Governing contract: ADR 0134 (data invariants); ADR 0220 (the ledger is append-only); ADR 0140 (refusals); ADR 0328
 *                     (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The row is append-only. */
export class AppendOnlyWriteError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The entity name of the append-only model. */
  model!: string;

  /** The refused write. */
  operation!: string;
}
