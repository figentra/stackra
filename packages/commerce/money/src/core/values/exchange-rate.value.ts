/**
 * Stackra file contract:
 * Purpose: `ExchangeRate`, a checked `RateSnapshot` that does the arithmetic: `convert` moves an amount from one
 *          currency to another, and `priceOf` prices a quantity of a commodity (grams of gold) from the day's metal
 *          rate, each rounded once.
 * Boundary: a value class built from a snapshot the caller kept (`ExchangeRate.from`), so a price never re-reads a
 *           feed. The rate is a decimal string and every product is exact BigInt arithmetic through `Money#times`.
 *           A currency pair converts and a commodity pair prices; asking the other is a `RangeError`, as is a bad
 *           snapshot.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: FX stores the rate and its source); ADR 0244 (decision 9: the rate is a
 *                     snapshot taken at checkout).
 */
import { Rounding } from "@stackra/contracts";

import type { RateSnapshot } from "#contracts/types/rate-snapshot.type";

import { CURRENCIES } from "#core/constants/currencies.constant";
import { decimalProduct } from "#core/functions/decimal-product.function";
import { shiftDecimal } from "#core/functions/shift-decimal.function";
import type { CurrencyCode } from "#core/types/currency-code.type";
import { Money } from "#core/values/money.value";

/** A positive plain decimal rate. */
const RATE = /^\d+(?:\.\d+)?$/;

/** A currency or commodity code: three upper-case letters. */
const CODE = /^[A-Z]{3}$/;

/**
 * A rate kept with the document that used it.
 *
 * @example
 * const usd = ExchangeRate.from({ base: "USD", quote: "SAR", unit: null, rate: "3.75", source: "sama", at });
 * usd.convert(Money.of("10.00", "USD")).toDecimal(); // "37.50"
 * const gold = ExchangeRate.from({ base: "XAU", quote: "SAR", unit: "gram", rate: "251.42", source: "feed", at });
 * gold.priceOf("10.9375").toDecimal(); // "2749.91"
 */
export class ExchangeRate {
  /** The priced currency or commodity. */
  readonly base: string;

  /** The currency prices come out in. */
  readonly quote: CurrencyCode;

  /** The commodity unit one rate prices; null for a currency pair. */
  readonly unit: string | null;

  /** Quote units per base unit, as a decimal string. */
  readonly rate: string;

  /** Where the rate came from. */
  readonly source: string;

  /** The instant the rate holds for. */
  readonly at: Date;

  private constructor(snapshot: RateSnapshot, quote: CurrencyCode) {
    this.base = snapshot.base;
    this.quote = quote;
    this.unit = snapshot.unit;
    this.rate = snapshot.rate;
    this.source = snapshot.source;
    this.at = new Date(snapshot.at.getTime());
  }

  /**
   * The rate a snapshot holds, checked.
   *
   * @throws RangeError when the rate is not a positive decimal, the quote is not a currency with minor units, the base
   *   is not a three-letter code (a currency one for a pair with no unit), the unit is empty, the source is empty or
   *   `at` is not a valid date.
   */
  static from(snapshot: RateSnapshot): ExchangeRate {
    if (!RATE.test(snapshot.rate) || !/[1-9]/.test(snapshot.rate))
      throw new RangeError(`ExchangeRate.from: "${snapshot.rate}" is not a positive decimal rate`);
    if (!CODE.test(snapshot.base))
      throw new RangeError(`ExchangeRate.from: "${snapshot.base}" is not a three-letter code`);
    if (snapshot.unit === null && !Object.hasOwn(CURRENCIES, snapshot.base))
      throw new RangeError(
        `ExchangeRate.from: "${snapshot.base}" is not a currency; a commodity rate names its unit`,
      );
    if (snapshot.unit !== null && snapshot.unit.trim() === "")
      throw new RangeError("ExchangeRate.from: the unit is empty");
    if (snapshot.source.trim() === "")
      throw new RangeError("ExchangeRate.from: the source is empty");
    if (Number.isNaN(snapshot.at.getTime()))
      throw new RangeError("ExchangeRate.from: `at` is not a valid date");
    return new ExchangeRate(snapshot, Money.zero(snapshot.quote).currency);
  }

  /**
   * `amount` in the quote currency, rounded once.
   *
   * @throws RangeError when this is a commodity rate, `amount` is not in the base currency, or the result is beyond
   *   the safe-integer limit.
   */
  convert(amount: Money, rounding: Rounding = Rounding.HalfEven): Money {
    if (this.unit !== null)
      throw new RangeError(
        `ExchangeRate.convert: ${this.base} per ${this.unit} prices a commodity`,
      );
    if (amount.currency !== this.base)
      throw new RangeError(
        `ExchangeRate.convert: the rate is for ${this.base}, the amount is in ${amount.currency}`,
      );
    const places = CURRENCIES[this.quote] - CURRENCIES[amount.currency];
    return Money.ofMinor(amount.minor, this.quote).times(shiftDecimal(this.rate, places), rounding);
  }

  /**
   * The price of `units` of the commodity in the quote currency, rounded once.
   *
   * @param units - how many of `unit` (grams of fine metal), a number or a decimal string.
   * @throws RangeError when this is a currency pair, `units` is not a decimal, or the price is beyond the
   *   safe-integer limit.
   */
  priceOf(units: number | string, rounding: Rounding = Rounding.HalfEven): Money {
    if (this.unit === null)
      throw new RangeError(
        `ExchangeRate.priceOf: ${this.base} in ${this.quote} is a currency pair`,
      );
    const major = decimalProduct(units, this.rate);
    return Money.ofMinor(1, this.quote).times(
      shiftDecimal(major, CURRENCIES[this.quote]),
      rounding,
    );
  }

  /** The snapshot to keep with a cart, quote or order. */
  toSnapshot(): RateSnapshot {
    return {
      base: this.base,
      quote: this.quote,
      unit: this.unit,
      rate: this.rate,
      source: this.source,
      at: new Date(this.at.getTime()),
    };
  }
}
