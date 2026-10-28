/**
 * Stackra file contract:
 * Purpose: `ModelInvalidError`, the refusal of a flush that would write a row of a `ValidateOnFlush` model its
 *          generated schema (`X$`) rejects: the unit of work rolls back and nothing is written.
 * Boundary: a refusal (`validation`, 400). `model` is the entity name and `issues` lists each problem as
 *           `<path>: <message>` (the message is the shape's i18n key or zod's code); no field value is carried.
 * Runtime: node
 * Governing contract: data-layer gap mo21 (stackra-287); ADR 0294 (decision 26); ADR 0140 (refusals); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A row fails its model's schema at flush. */
export class ModelInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The entity name of the model. */
  model!: string;

  /** The problems, each `<path>: <message>`. */
  issues!: readonly string[];
}
