/**
 * Stackra file contract:
 * Purpose: `TenderSplit`, a basket split between a restricted tender and the rest: what the restricted tender pays,
 *          the tax it waives, what is left for an ordinary tender, and which lines were eligible.
 * Boundary: a type in the leaf entry; `splitTender` makes it. `restricted + remainder + waivedTax` is the basket total
 *           (lines plus their tax). All amounts are in the basket's currency.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; R3-SO-08; ADR 0220.
 */
import type { Money } from "@stackra/money";

/**
 * Who pays what.
 *
 * @example
 * const { restricted, remainder } = await tenders.split(market, "snap", lines);
 */
export interface TenderSplit {
  /** The program code. */
  readonly program: string;

  /** What the restricted tender pays. */
  readonly restricted: Money;

  /** What an ordinary tender pays: ineligible lines, their tax, and eligible lines above the balance. */
  readonly remainder: Money;

  /** The tax not charged because the restricted tender paid that part (zero unless the program is tax-exempt). */
  readonly waivedTax: Money;

  /** The indexes of the eligible lines, in basket order. */
  readonly eligible: readonly number[];
}
