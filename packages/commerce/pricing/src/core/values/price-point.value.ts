/**
 * Stackra file contract:
 * Purpose: `PricePoint`, the price endings a market rounds its prices to: every amount `k × step + ending` in one
 *          currency (`step` 100 and `ending` 99 in USD are 0.99, 1.99, 2.99 …), and `apply`, which moves a computed
 *          price (an adjusted price list, a converted amount) onto one of those points by an explicit `Rounding`.
 * Boundary: a value class over `@stackra/money`; the arithmetic is `Money`'s, so no rounding happens here beyond the one
 *           the caller names. `step` and `ending` are whole minor units of `currency`. Instances are plain data (no
 *           `#private`, not frozen) so a Market can store one as an embeddable; build one with `PricePoint.ofMinor`.
 *           Which point a Market uses and when it applies is the OS pricing service's decision, not this package's.
 *           Refusals are `RangeError`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 6: prices round to a price point, per Market); ADR 0220 (decision 3: one
 *                     explicit rounding); ADR 0127 (pricing primitives in commerce; the engine is an OS service).
 */
import { Money, Rounding } from "@stackra/money";
import type { CurrencyCode } from "@stackra/money";

/**
 * The price points `k × step + ending` (k = 0, 1, 2 …) of one currency.
 *
 * @example
 * const charm = PricePoint.ofMinor(100, 99, "USD"); // 0.99, 1.99, 2.99 …
 * charm.apply(Money.of("12.34", "USD")).toDecimal(); // "12.99"
 * charm.apply(Money.of("12.34", "USD"), Rounding.HalfEven).toDecimal(); // "11.99", the nearest point
 */
export class PricePoint {
  /** The distance between two points in minor units: a positive safe integer (100 is one dollar in USD). */
  readonly step: number;

  /** The minor units every point ends on: an integer from 0 to `step - 1` (99 gives x.99 in USD). */
  readonly ending: number;

  /** The currency `step` and `ending` are counted in. */
  readonly currency: CurrencyCode;

  private constructor(step: number, ending: number, currency: CurrencyCode) {
    this.step = step;
    this.ending = ending;
    this.currency = currency;
  }

  /**
   * The points `k × step + ending` in `currency`.
   *
   * @param step - minor units between two points; a positive safe integer.
   * @param ending - minor units each point ends on; an integer from 0 to `step - 1`.
   * @param currency - an ISO 4217 code; a plain string is checked here.
   * @throws RangeError when `step` is not a positive safe integer, `ending` is outside 0 to `step - 1`, or `currency`
   *   is not a code with minor units.
   */
  static ofMinor(step: number, ending: number, currency: string): PricePoint {
    if (!Number.isSafeInteger(step) || step <= 0)
      throw new RangeError(
        `PricePoint.ofMinor: the step must be a positive safe integer, got ${step}`,
      );
    if (!Number.isInteger(ending) || ending < 0 || ending >= step)
      throw new RangeError(
        `PricePoint.ofMinor: the ending must be an integer from 0 to ${step - 1}, got ${ending}`,
      );
    return new PricePoint(step, ending === 0 ? 0 : ending, Money.zero(currency).currency);
  }

  /**
   * `price` moved onto a point. `Up` gives the smallest point at or above it, `Down` the largest at or below it, and
   * `HalfUp` or `HalfEven` the nearest, a tie going up or to the point with an even `k`. A price at or below the
   * first point (`ending`) becomes the first point in every mode; zero stays zero, so a free item is not given a price.
   *
   * @param price - a non-negative amount in this point's currency.
   * @param rounding - which neighbouring point to take; `Up` by default, so a rounded price never undercuts the list.
   * @returns a new `Money` on a point, or `price` itself when it is zero.
   * @throws RangeError when `price` is negative or in another currency, or the point is beyond the safe-integer limit.
   */
  apply(price: Money, rounding: Rounding = Rounding.Up): Money {
    if (price.currency !== this.currency)
      throw new RangeError(
        `PricePoint.apply: the point is in ${this.currency}, the price in ${price.currency}`,
      );
    if (price.minor < 0)
      throw new RangeError(`PricePoint.apply: a price cannot be negative, got ${price.minor}`);
    if (price.minor === 0) return price;
    const ending = Money.ofMinor(this.ending, this.currency);
    if (price.minor <= this.ending) return ending;
    // Above the first point the offset is positive, so Money's zero-relative rounding is also upward or downward.
    return price.minus(ending).divide(this.step, rounding).times(this.step).plus(ending);
  }
}
