/**
 * Stackra file contract:
 * Purpose: `ChargeInitiator`, who starts a charge on a saved token: the customer, present now, or the merchant on a
 *          standing agreement (a merchant-initiated transaction).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A merchant-initiated charge is
 *           allowed only on a `SavedMethod` whose `merchantInitiated` flag is set. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5: a saved card is a gateway token); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * Customer- or merchant-initiated.
 *
 * @example
 * await payments.charge({ reference, method, amount, initiator: ChargeInitiator.Merchant });
 */
export const ChargeInitiator = Enum.of({
  /** The customer is present and starts the charge. */
  Customer: "customer",
  /** The merchant charges on an agreement the customer gave earlier. */
  Merchant: "merchant",
});

/** One of the codes above. */
export type ChargeInitiator = Enum.Value<typeof ChargeInitiator>;
