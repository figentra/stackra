/**
 * Stackra file contract:
 * Purpose: `RecordHeldError`, the refusal of a delete of a record under a legal hold: the flush is aborted, so nothing
 *          of the unit of work is written.
 * Boundary: a refusal (`failed_precondition`); `model` is the entity name and `id` the record's primary key. The hold
 *           is lifted in the compliance service, never here.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: a held record is never disposed of); ADR 0140 (refusals); ADR
 *                     0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The record is held. */
export class RecordHeldError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The entity name of the held record. */
  model!: string;

  /** The held record's primary key. */
  id!: string;
}
