/**
 * Stackra file contract:
 * Purpose: `UnitPrice`, a price per unit with six decimals of the major unit (`0.000123` USD per API call), held as a
 *          safe integer of millionths, and `times`, which charges a quantity as a `Money` with one explicit rounding.
 * Boundary: a value class beside `Money`, not a `Money`: an amount that is owed or paid is always whole minor units;
 *           only a rate per unit has six decimals. Plain data (no `#private`, not frozen, private constructor), so its
 *           JSON is `{ micros, currency }`. Refusals are `RangeError`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decisions 1 to 3); the OS-114 answer (6-decimal unit prices).
 */
import { Rounding } from "@stackra/contracts";

import { CURRENCIES } from "#core/constants/currencies.constant";
import { UNIT_PRICE_SCALE } from "#core/constants/unit-price-scale.constant";
import { decimalParts } from "#core/functions/decimal-parts.function";
import { decimalProduct } from "#core/functions/decimal-product.function";
import { shiftDecimal } from "#core/functions/shift-decimal.function";
import type { CurrencyCode } from "#core/types/currency-code.type";
import { Money } from "#core/values/money.value";

/** Millionths in one major unit. */
const MICROS = 10n ** BigInt(UNIT_PRICE_SCALE);

/**
 * A per-unit price with six decimals.
 *
 * @example
 * const call = UnitPrice.of("0.000123", "USD");
 * call.times(1_000_000).toDecimal(); // "123.00"
 * call.times(10).toDecimal(); // "0.00", 0.00123 rounds half-even to zero cents
 */
export class UnitPrice {
  /** The price in millionths of the major unit: a safe integer. */
  readonly micros: number;

  /** The currency of the price. */
  readonly currency: CurrencyCode;

  private constructor(micros: number, currency: CurrencyCode) {
    this.micros = micros === 0 ? 0 : micros;
    this.currency = currency;
  }

  /**
   * A unit price from its decimal (`"0.000123"`).
   *
   * @throws RangeError when `decimal` is not a plain decimal, has more than six fraction digits, is beyond the
   *   safe-integer limit in millionths, or `currency` is not a code with minor units.
   */
  static of(decimal: string, currency: string): UnitPrice {
    const code = Money.zero(currency).currency;
    const { digits, scale } = decimalParts(decimal);
    if (scale > UNIT_PRICE_SCALE)
      throw new RangeError(
        `UnitPrice.of: at most ${UNIT_PRICE_SCALE} fraction digits, "${decimal}" has ${scale}`,
      );
    return UnitPrice.ofMicros(Number(digits * 10n ** BigInt(UNIT_PRICE_SCALE - scale)), code);
  }

  /**
   * A unit price from millionths of the major unit.
   *
   * @throws RangeError when `micros` is not a safe integer or `currency` is not a code with minor units.
   */
  static ofMicros(micros: number, currency: string): UnitPrice {
    if (!Number.isSafeInteger(micros))
      throw new RangeError(`UnitPrice.ofMicros: ${micros} is not a safe integer of millionths`);
    return new UnitPrice(micros, Money.zero(currency).currency);
  }

  /**
   * The charge for `quantity` units, rounded once to whole minor units.
   *
   * @param quantity - a finite number or a decimal string (a metered 2.5 GB is fine).
   * @param rounding - half-even by default.
   * @throws RangeError when `quantity` is not a decimal or the charge is beyond the safe-integer limit.
   */
  times(quantity: number | string, rounding: Rounding = Rounding.HalfEven): Money {
    const major = decimalProduct(this.toDecimal(), quantity);
    return Money.ofMinor(1, this.currency).times(
      shiftDecimal(major, CURRENCIES[this.currency]),
      rounding,
    );
  }

  /** Whether `other` is the same price in the same currency. */
  equals(other: UnitPrice): boolean {
    return this.currency === other.currency && this.micros === other.micros;
  }

  /** The price with exactly six fraction digits (`"0.000123"`, `"-1.500000"`). */
  toDecimal(): string {
    const value = BigInt(this.micros);
    const absolute = value < 0n ? -value : value;
    const fraction = String(absolute % MICROS).padStart(UNIT_PRICE_SCALE, "0");
    return `${value < 0n ? "-" : ""}${absolute / MICROS}.${fraction}`;
  }
}
