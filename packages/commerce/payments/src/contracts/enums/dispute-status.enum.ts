/**
 * Stackra file contract:
 * Purpose: `DisputeStatus`, where a chargeback stands: waiting for evidence, under the issuer's review, won, lost, or
 *          accepted by the merchant.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (Enforcement: the dispute port); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The dispute states.
 *
 * @example
 * if (dispute.status === DisputeStatus.NeedsResponse) await gateway.respond(dispute.providerRef, evidence);
 */
export const DisputeStatus = Enum.of({
  /** Evidence is due. */
  NeedsResponse: "needs_response",
  /** Evidence was sent; the issuer decides. */
  UnderReview: "under_review",
  /** Decided for the merchant. */
  Won: "won",
  /** Decided for the cardholder. */
  Lost: "lost",
  /** The merchant accepted it without contest. */
  Accepted: "accepted",
});

/** One of the codes above. */
export type DisputeStatus = Enum.Value<typeof DisputeStatus>;
