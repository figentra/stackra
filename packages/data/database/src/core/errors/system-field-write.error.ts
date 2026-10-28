/**
 * Stackra file contract:
 * Purpose: `SystemFieldWriteError`, the refusal of a `CrudService` write whose data sets a field the system writes (the
 *          public id on a change, a timestamp, a user stamp, a delete-policy marker, the version): those come from the
 *          stamps, the delete policy and the optimistic lock, never from a caller.
 * Boundary: a refusal (`validation`, 400): the input is wrong. `model` is the entity name, `field` the first system
 *           field the data sets, `operation` the refused write (`create`, `insert`, `insertMany`, `upsert`, `update`,
 *           `updateWhere`). The field's value is never carried.
 * Runtime: node
 * Governing contract: data-layer gap mo21 (stackra-287); ADR 0133 (decision 7); ADR 0140 (refusals); ADR 0328 (built
 *                     with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The write sets a system-written field. */
export class SystemFieldWriteError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The entity name of the model. */
  model!: string;

  /** The system field the data sets, such as `createdBy`. */
  field!: string;

  /** The refused write. */
  operation!: string;
}
