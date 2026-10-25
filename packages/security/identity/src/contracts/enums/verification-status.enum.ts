/**
 * Stackra file contract:
 * Purpose: `VerificationStatus`, where a check stands: verified, rejected, waiting for a person to review, or pending
 *          at the provider (an asynchronous check that answers later by webhook).
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are stored on verification records, so a code
 *           never changes. What a status allows (a payout, a marketplace listing) is a rule set, not code.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54; ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The states of a check. */
export const VerificationStatus = Enum.of({
  /** The provider confirmed it. */
  Verified: "verified",
  /** The provider refused it. */
  Rejected: "rejected",
  /** The provider flagged it for a person to review. */
  Review: "review",
  /** The provider has not answered yet. */
  Pending: "pending",
});

/** One of the codes above. */
export type VerificationStatus = Enum.Value<typeof VerificationStatus>;
