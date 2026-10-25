/**
 * Stackra file contract:
 * Purpose: `TransferLimitExceededError` (`transfer_limit_exceeded`), the refusal of a file past a row or byte limit the
 *          caller set from its settings.
 * Boundary: thrown by a reader while it streams, so rows before the limit may already have been yielded; a validation
 *           refusal (400), never retryable. Its details are which limit and its value.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 4); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The file is past a limit. */
export class TransferLimitExceededError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** Which limit (`rows` or `bytes`). */
  limit!: "rows" | "bytes";

  /** The limit's value. */
  max!: number;
}
