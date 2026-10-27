/**
 * Stackra file contract:
 * Purpose: `TenderLine`, one basket line as a restricted tender sees it: a `PaymentLine` plus the tax on the whole line
 *          and the category the eligibility rule set reads.
 * Boundary: a type in the leaf entry. Amounts are `Money` in the basket's currency; `tax` is the tax of the line (all
 *           units), not per unit. Which lines are eligible is the rule set's answer (`TenderEligibility`), never a
 *           field here.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0357 (decision 2); ADR 0220 (integer minor units); R3-SO-08.
 */
import type { Money } from "@stackra/money";

import type { PaymentLine } from "#contracts/types/payment-line.type";

/**
 * A basket line with its tax and category.
 *
 * @example
 * const line: TenderLine = { name: "Milk", quantity: 2, unitPrice: Money.of("1.50", "USD"), category: "dairy", tax: Money.of("0.21", "USD") };
 */
export interface TenderLine extends PaymentLine {
  /** The tax on the whole line, when it carries any. */
  readonly tax?: Money;

  /** The product category the eligibility rule set reads. */
  readonly category?: string;
}
