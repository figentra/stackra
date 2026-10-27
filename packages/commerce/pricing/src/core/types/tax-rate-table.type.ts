/**
 * Stackra file contract:
 * Purpose: `TaxRateTable`, a market's tax rates on a date: the rows, how each line's tax rounds, and the label of the
 *          pack version they came from.
 * Boundary: a type only; market-pack data read for the sale date. `taxByRates` computes with it.
 * Runtime: isomorphic
 * Governing contract: the OS-109 answer; ADR 0220 (decision 3: half-up where a tax rule requires it).
 */
import type { Rounding } from "@stackra/money";

import type { TaxRate } from "#core/types/tax-rate.type";

/** The rates of one market on one date. */
export interface TaxRateTable {
  /** The pack and version the rows came from (`sa@2.3.0`), named on every quote. */
  readonly source: string;

  /** How a line's tax rounds to minor units, as the market's rule says. */
  readonly rounding: Rounding;

  /** The tax rates, one row each. */
  readonly rates: readonly TaxRate[];
}
