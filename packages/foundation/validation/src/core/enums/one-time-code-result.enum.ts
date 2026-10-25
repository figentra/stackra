/**
 * Stackra file contract:
 * Purpose: `OneTimeCodeResult`, the outcome of checking a one-time code: valid, wrong, expired, or locked after too
 *          many attempts.
 * Boundary: an `Enum.of` value plus the type of the same name. The caller turns a non-valid result into its own
 *           refusal; a person is told only "wrong or expired", never which.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: Enum.of); ADR 0231; conflict #2 (one-time codes in validation).
 */
import { Enum } from "@stackra/contracts";

/**
 * The outcomes of `verifyOneTimeCode`.
 *
 * @example
 * if (outcome.result !== OneTimeCodeResult.Valid) throw CodeRejectedError.create({});
 */
export const OneTimeCodeResult = Enum.of({
  /** The code matched, in time, within the attempts; the record is spent. */
  Valid: "valid",
  /** The code did not match; one attempt is used. */
  Invalid: "invalid",
  /** The code's time ran out. */
  Expired: "expired",
  /** Every attempt is used, or the code was already accepted; no code is checked any more. */
  Locked: "locked",
});

/** One of the codes above. */
export type OneTimeCodeResult = Enum.Value<typeof OneTimeCodeResult>;
