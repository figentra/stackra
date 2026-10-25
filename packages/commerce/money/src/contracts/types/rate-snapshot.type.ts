/**
 * Stackra file contract:
 * Purpose: `RateSnapshot`, one rate as a source answered it, kept with the cart, quote or order that used it: the pair,
 *          the rate as a decimal string, the source that gave it and the instant it holds for.
 * Boundary: a type only, plain data, so it travels in a replica and a stored document unchanged. `rate` is a decimal
 *           string (`"3.750000"`), never a float, so no digit is lost. `ExchangeRate.from` checks it before any
 *           arithmetic.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: FX stores the rate and its source); ADR 0244 (decision 9); ADR 0337
 *                     (decision 3: a result names the data it was computed from).
 */
import type { RatePair } from "#contracts/types/rate-pair.type";

/**
 * A rate and where it came from.
 *
 * @example
 * const gold: RateSnapshot = { base: "XAU", quote: "SAR", unit: "gram", rate: "251.420000", source: "feed", at };
 */
export interface RateSnapshot extends RatePair {
  /** Quote units for one base unit, as a plain positive decimal string. */
  readonly rate: string;

  /** The source's driver name or feed id, as the market pack names it. */
  readonly source: string;

  /** The instant the rate holds for. */
  readonly at: Date;
}
