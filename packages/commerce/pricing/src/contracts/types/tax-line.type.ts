/**
 * Stackra file contract:
 * Purpose: `TaxLine`, one line of a sale to tax: its id, its amount and the tax class the catalogue gives the item.
 * Boundary: a type only. `amount` is the line total after discounts; whether it includes tax is the request's
 *           `pricesIncludeTax`. A tax class is catalogue data (`standard`, `zero`, `gold_investment`), never a rate.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 9); ADR 0220 (decision 1: minor units).
 */
import type { Money } from "@stackra/money";

/** A line to tax. */
export interface TaxLine {
  /** The line's id, answered back on its taxed line. */
  readonly id: string;

  /** The line total in the request's currency. */
  readonly amount: Money;

  /** The item's tax class, as the market's tax table names it. */
  readonly taxClass: string;
}
