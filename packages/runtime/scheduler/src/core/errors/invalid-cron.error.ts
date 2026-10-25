/**
 * Stackra file contract:
 * Purpose: `InvalidCronError`, the refusal of a cron expression that is not five valid fields (`invalid_cron`).
 * Boundary: kind `Validation` (HTTP 400), not retryable. Its details name the expression and the field that failed
 *           (`minute`, `hour`, `day`, `month`, `weekday`, or `expression` for the wrong number of fields), so an action
 *           that saves a schedule refuses the caller's input as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0148 (decision 5); final review R-02 (typed `create`);
 *                     ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The cron expression is not five valid fields.
 *
 * @example
 * throw InvalidCronError.create({ expression: "61 * * * *", field: "minute" });
 */
export class InvalidCronError extends Refusal({ kind: ErrorKind.Validation }) {
  /** The expression as given. */
  expression!: string;

  /** The field that failed, or `expression` when the expression is not five fields. */
  field!: string;
}
