/**
 * Stackra file contract:
 * Purpose: `TenderKind`, what a payment is tendered with: an ordinary card or wallet, or a restricted tender (a
 *          benefit or voucher program such as EBT SNAP or a meal voucher) that only eligible lines may pay.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Which restricted programs a Market
 *           offers, and their rules, are pack data (`RestrictedTenderProgram`), never a code here. Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0357 (decision 2); R3-SO-08; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The two tender kinds.
 *
 * @example
 * await payments.startTerminal(market, { reference, terminalId, amount, tender: TenderKind.Restricted, program: "snap" });
 */
export const TenderKind = Enum.of({
  /** A card or wallet with no line restriction (the default when a request names none). */
  Card: "card",
  /** A program tender that pays eligible lines only (`PaymentCapability.RestrictedTender`). */
  Restricted: "restricted",
});

/** One of the codes above. */
export type TenderKind = Enum.Value<typeof TenderKind>;
