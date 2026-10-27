/**
 * Stackra file contract:
 * Purpose: `PaymentCapability`, what a provider's driver can do beyond a hosted checkout: capture and void, saved
 *          tokens, payouts, the platform layer, disputes, terminal sessions, a tip prompt on the terminal, reading
 *          the account's enabled payment methods, a restricted tender (EBT, meal vouchers) and PIN entry on the terminal.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. A driver lists its capabilities;
 *           `PaymentGateways#forMarket` keeps only providers that have every capability a call needs, and
 *           `hasCapability` narrows a gateway to the matching port. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decisions 2 and 5); ADR 0356 (decision 2); ADR 0231; ADR 0445.
 */
import { Enum } from "@stackra/contracts";

/**
 * One capability per optional gateway port.
 *
 * @example
 * const gateway = await gateways.forMarket(market, [PaymentCapability.Checkout, PaymentCapability.Capture]);
 */
export const PaymentCapability = Enum.of({
  /** A hosted page or widget where the customer pays (`PaymentGateway`). */
  Checkout: "checkout",
  /** Authorise now, capture or void later (`CaptureGateway`). */
  Capture: "capture",
  /** Charge a saved token, customer- or merchant-initiated (`TokenGateway`). */
  Tokens: "tokens",
  /** Send money to a merchant's account (`PayoutGateway`). */
  Payouts: "payouts",
  /** Onboard a merchant under the platform's provider account (`PlatformGateway`). */
  Platform: "platform",
  /** Read and answer chargebacks (`DisputeGateway`). */
  Disputes: "disputes",
  /** Present an amount on a semi-integrated card terminal (`TerminalGateway`). */
  Terminal: "terminal",
  /** Ask for a tip on the terminal before the card is read. */
  TerminalTips: "terminal_tips",
  /** Read the payment methods the account has enabled (`MethodsGateway`). */
  Methods: "methods",
  /** Take a restricted tender program (`TenderKind.Restricted`) at checkout or on the terminal. */
  RestrictedTender: "restricted_tender",
  /** Ask for a PIN on the terminal before the payment is approved. */
  TerminalPin: "terminal_pin",
});

/** One of the codes above. */
export type PaymentCapability = Enum.Value<typeof PaymentCapability>;
