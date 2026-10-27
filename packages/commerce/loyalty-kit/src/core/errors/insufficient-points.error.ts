/**
 * Stackra file contract:
 * Purpose: `InsufficientPointsError`, the refusal when a member asks for more points than they hold.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `insufficient_points`, derived from
 *           the class name; the fields are numbers only, never personal data. The text is
 *           `loyalty_kit::errors.insufficient_points.message`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0140 (envelope and kinds); ADR 0232; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { Int } from "@stackra/validation";

/**
 * Not retryable: the balance changes only by an earn or an adjustment.
 *
 * @example
 * throw InsufficientPointsError.create({ balance, requested: points });
 */
export class InsufficientPointsError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** Points the member holds now. */
  @Int({ min: 0 })
  balance!: number;

  /** Points the caller asked for. */
  @Int({ min: 0 })
  requested!: number;
}
