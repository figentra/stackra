/**
 * Stackra file contract:
 * Purpose: `RestrictedTenderUnavailableError` (`restricted_tender_unavailable`), the refusal of a restricted tender
 *          program the Market does not offer (not in its pack, or not live).
 * Boundary: kind `FailedPrecondition`, not retryable as it stands. Carries the Market and program codes only.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The Market does not offer the program.
 *
 * @example
 * throw RestrictedTenderUnavailableError.create({ market: "eu-fr", program: "snap" });
 */
export class RestrictedTenderUnavailableError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The Market asked for. */
  market!: string;

  /** The program code asked for. */
  program!: string;
}
