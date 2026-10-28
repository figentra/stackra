/**
 * Stackra file contract:
 * Purpose: `MetadataInvalidError`, the refusal of a write that sets a `HasMetadata` record's `metadata` to something
 *          other than a bag of string keys to string values of at most 16 KB.
 * Boundary: a refusal (`validation`, 400). `model` is the entity name and `reason` one of `not_object`,
 *           `value_not_string` or `too_large`; no metadata value is carried.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 4: the 16 KB bound); ADR 0140 (refusals); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A record's metadata is not a bounded string bag. */
export class MetadataInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The entity name of the model. */
  model!: string;

  /** Why it was refused: `not_object`, `value_not_string` or `too_large`. */
  reason!: string;
}
