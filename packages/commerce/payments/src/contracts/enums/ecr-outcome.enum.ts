/**
 * Stackra file contract:
 * Purpose: `EcrOutcome`, what a semi-integrated card terminal's answer says happened, before the driver maps it onto
 *          `PaymentStatus` or `TransferStatus` for the operation it answered: approved, declined, cancelled on the
 *          terminal (or by the till's cancel), or still pending.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Which of a provider's result codes
 *           means which outcome is `EcrProfile.results` (pack data), never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1, 2 and 9); ADR 0357 (decision 6); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * A terminal answer's outcome.
 *
 * @example
 * const profile = { results: { "00": EcrOutcome.Approved, "05": EcrOutcome.Declined } };
 */
export const EcrOutcome = Enum.of({
  /** The terminal's acquirer approved the operation. */
  Approved: "approved",
  /** Refused by the card, the acquirer or the terminal. */
  Declined: "declined",
  /** Cancelled on the terminal before it completed, by the customer, the cashier or the till's cancel. */
  Cancelled: "cancelled",
  /** Still running on the terminal. */
  Pending: "pending",
});

/** One of the codes above. */
export type EcrOutcome = Enum.Value<typeof EcrOutcome>;
