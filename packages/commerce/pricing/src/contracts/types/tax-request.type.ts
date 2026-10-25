/**
 * Stackra file contract:
 * Purpose: `TaxRequest`, what a `TaxProvider` is asked: the lines of a sale, their currency, where the buyer is, when
 *          the sale happens and whether the amounts include tax.
 * Boundary: a type only. `at` is the sale instant (a dated rate change applies from its date); it comes from the
 *           caller's clock, never read here.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 9); ADR 0337 (decision 2: the time is an argument).
 */
import type { TaxAddress } from "#contracts/types/tax-address.type";
import type { TaxLine } from "#contracts/types/tax-line.type";

/** A sale to tax. */
export interface TaxRequest {
  /** ISO 4217 currency of every line. */
  readonly currency: string;

  /** When the sale happens. */
  readonly at: Date;

  /** Where the buyer is. */
  readonly destination: TaxAddress;

  /** The lines, in order. */
  readonly lines: readonly TaxLine[];

  /** True when each line's amount already includes its tax (a tax-inclusive market). */
  readonly pricesIncludeTax: boolean;
}
