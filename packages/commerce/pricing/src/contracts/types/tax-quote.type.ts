/**
 * Stackra file contract:
 * Purpose: `TaxQuote`, a provider's answer to a `TaxRequest`: the tax per line, their total and the source it came from
 *          (the rate table's pack version, or the provider), kept with the order.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 9); ADR 0337 (decision 3: a result names the data it was computed from).
 */
import type { Money } from "@stackra/money";

import type { TaxedLine } from "#contracts/types/taxed-line.type";

/** The tax of a sale. */
export interface TaxQuote {
  /** One taxed line per requested line, in order. */
  readonly lines: readonly TaxedLine[];

  /** The sum of the lines' tax. */
  readonly total: Money;

  /** Where the rates came from: a rate table's label or the provider's name and reference. */
  readonly source: string;
}
