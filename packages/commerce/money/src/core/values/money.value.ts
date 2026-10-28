/**
 * Stackra file contract:
 * Purpose: `Money`, an amount in whole minor units of one ISO 4217 currency, with exact arithmetic: `plus`, `minus`,
 *          `times` and `divide` with one explicit rounding, allocation by ratios with no lost minor unit, and the
 *          decimal string for display and structured data.
 * Boundary: a value class. `minor` is a JavaScript `number` that is always a safe integer: a value or a result beyond
 *           `Number.MAX_SAFE_INTEGER` is refused, never rounded. Every operation returns a new `Money`; mixing
 *           currencies is refused. Arithmetic runs on BigInt, and a JavaScript factor or divisor is read as the decimal
 *           it prints as, so `0.145` is exactly 145/1000; `times` and `divide` also take a decimal string, read as written. Instances are not frozen and the constructor is private: the
 *           ORM maps `Money` as an embeddable (two columns) and builds loaded values without the constructor (ADR 0294
 *           decision 27), so code builds one with `Money.ofMinor` or `Money.of`. Refusals are `RangeError`s.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decisions 1 to 3: minor units, ISO 4217 exponent, half-even default, exact
 *                     allocation); ADR 0294 (decision 26: `Money.of` is a constant gen evaluates; decision 27: the
 *                     safe-integer limit); ADR 0127 (money in commerce).
 */
import { Rounding } from "@stackra/contracts";

import { CURRENCIES } from "#core/constants/currencies.constant";
import type { CurrencyCode } from "#core/types/currency-code.type";

/** The largest minor amount a `Money` holds, as a BigInt for exact comparison. */
const MAX_MINOR = BigInt(Number.MAX_SAFE_INTEGER);

/** A plain decimal amount: optional minus, digits, optional fraction (`"12"`, `"-0.50"`). */
const DECIMAL = /^(-)?(\d+)(?:\.(\d+))?$/;

/** The code as a `CurrencyCode`, or a `RangeError` naming it. */
function toCurrency(code: string): CurrencyCode {
  if (!Object.hasOwn(CURRENCIES, code))
    throw new RangeError(`Money: "${code}" is not an ISO 4217 currency code with minor units`);
  return code as CurrencyCode;
}

/** The BigInt minor amount as a `number`, or a `RangeError` when it is not a safe integer. */
function toSafeMinor(value: bigint): number {
  if (value > MAX_MINOR || value < -MAX_MINOR)
    throw new RangeError(`Money: ${value} minor units is beyond Number.MAX_SAFE_INTEGER`);
  return Number(value);
}

/** Refuses an operation on two currencies, so a sum never adds dollars to euros. */
function assertSameCurrency(left: Money, right: Money, operation: string): void {
  if (left.currency !== right.currency)
    throw new RangeError(
      `Money.${operation}: ${left.currency} and ${right.currency} cannot be mixed`,
    );
}

/**
 * A finite number, or a plain decimal string, as the exact ratio of the decimal it prints as: `numerator /
 * denominator`, the denominator a positive power of ten (`0.145` is 145/1000, `1e21` is 10^21/1, `"0.000123"` is
 * 123/1000000). A string is read as written, so a rate or a 6-decimal unit price keeps every digit.
 */
function toRatio(value: number | string, name: string): { numerator: bigint; denominator: bigint } {
  if (typeof value === "string") {
    const match = DECIMAL.exec(value);
    if (match === null)
      throw new RangeError(`Money: the ${name} "${value}" is not a decimal such as "0.145"`);
    const [, sign, whole = "0", fraction = ""] = match;
    const digits = BigInt(whole + fraction);
    return {
      numerator: sign === undefined ? digits : -digits,
      denominator: 10n ** BigInt(fraction.length),
    };
  }
  if (!Number.isFinite(value))
    throw new RangeError(`Money: the ${name} must be finite, got ${value}`);
  const [mantissa = "0", exponentText = "0"] = String(value).split("e");
  const [whole = "0", fraction = ""] = mantissa.split(".");
  const exponent = Number(exponentText) - fraction.length;
  const digits = BigInt(whole + fraction);
  return exponent >= 0
    ? { numerator: digits * 10n ** BigInt(exponent), denominator: 1n }
    : { numerator: digits, denominator: 10n ** BigInt(-exponent) };
}

/** `numerator / denominator` rounded to an integer by `rounding`; directions are relative to zero. */
function roundQuotient(numerator: bigint, denominator: bigint, rounding: Rounding): bigint {
  const [n, d] = denominator < 0n ? [-numerator, -denominator] : [numerator, denominator];
  const quotient = n / d;
  const remainder = n % d;
  if (remainder === 0n) return quotient;
  const away = quotient + (n < 0n ? -1n : 1n);
  const twice = (remainder < 0n ? -remainder : remainder) * 2n;
  switch (rounding) {
    case Rounding.Down:
      return quotient;
    case Rounding.Up:
      return away;
    case Rounding.HalfUp:
      return twice >= d ? away : quotient;
    case Rounding.HalfEven:
      return twice > d || (twice === d && quotient % 2n !== 0n) ? away : quotient;
    default:
      throw new RangeError(`Money: "${String(rounding)}" is not a Rounding`);
  }
}

/**
 * An amount of money in whole minor units of one currency (cents for USD, fils for KWD, yen for JPY).
 *
 * @example
 * const price = Money.ofMinor(9_900, "USD");
 * price.toDecimal(); // "99.00"
 * price.divide(12, Rounding.Down).toDecimal(); // "8.25"
 * Money.of("10.00", "USD").allocate([1, 1, 1]).map((m) => m.minor); // [334, 333, 333]
 */
export class Money {
  /** The amount in minor units: a safe integer, negative for a debit or a refund. */
  readonly minor: number;

  /** The ISO 4217 currency of the amount. */
  readonly currency: CurrencyCode;

  private constructor(minor: number, currency: CurrencyCode) {
    this.minor = minor === 0 ? 0 : minor; // never -0
    this.currency = currency;
  }

  /**
   * An amount from its minor units, the form prices travel in (`priceMinor`, `totalMinor`).
   *
   * @param minor - whole minor units; a safe integer.
   * @param currency - an ISO 4217 code; a plain string is checked here.
   * @throws RangeError when `minor` is not a safe integer or `currency` is not a code with minor units.
   */
  static ofMinor(minor: number, currency: string): Money {
    if (!Number.isSafeInteger(minor))
      throw new RangeError(`Money.ofMinor: ${minor} is not a safe integer number of minor units`);
    return new Money(minor, toCurrency(currency));
  }

  /**
   * Nothing in `currency`: the start of a sum (`lines.reduce((sum, line) => sum.plus(line), Money.zero("USD"))`).
   *
   * @throws RangeError when `currency` is not a code with minor units.
   */
  static zero(currency: string): Money {
    return new Money(0, toCurrency(currency));
  }

  /**
   * The largest of the amounts (`Money.max(total, zero)` clamps a total at zero); the first wins a tie.
   *
   * @throws RangeError when the currencies differ.
   */
  static max(first: Money, ...others: Money[]): Money {
    return others.reduce((largest, other) => {
      assertSameCurrency(largest, other, "max");
      return other.minor > largest.minor ? other : largest;
    }, first);
  }

  /**
   * An amount from its decimal string (`Money.of("12.50", "USD")` is 1 250 minor units). Pure in its arguments, so gen
   * evaluates it in a field default.
   *
   * @param decimal - digits with an optional minus and at most the currency's exponent of fraction digits.
   * @param currency - an ISO 4217 code.
   * @throws RangeError when `decimal` is not a plain decimal, has more fraction digits than the currency (never rounded
   *   silently), is beyond the safe-integer limit, or `currency` is not a code with minor units.
   */
  static of(decimal: string, currency: string): Money {
    const code = toCurrency(currency);
    const match = DECIMAL.exec(decimal);
    if (match === null)
      throw new RangeError(`Money.of: "${decimal}" is not a decimal amount such as "12.50"`);
    const [, sign, whole = "0", fraction = ""] = match;
    const exponent = CURRENCIES[code];
    if (fraction.length > exponent)
      throw new RangeError(
        `Money.of: ${code} has ${exponent} fraction digits, "${decimal}" has ${fraction.length}`,
      );
    const minor = BigInt(whole + fraction.padEnd(exponent, "0"));
    return new Money(toSafeMinor(sign === undefined ? minor : -minor), code);
  }

  /**
   * This amount plus `other`.
   * @throws RangeError when the currencies differ or the sum is beyond the safe-integer limit.
   */
  plus(other: Money): Money {
    assertSameCurrency(this, other, "plus");
    return new Money(toSafeMinor(BigInt(this.minor) + BigInt(other.minor)), this.currency);
  }

  /**
   * This amount minus `other`.
   * @throws RangeError when the currencies differ or the difference is beyond the safe-integer limit.
   */
  minus(other: Money): Money {
    assertSameCurrency(this, other, "minus");
    return new Money(toSafeMinor(BigInt(this.minor) - BigInt(other.minor)), this.currency);
  }

  /**
   * This amount times `factor` (a rate, a quantity), rounded once to whole minor units.
   *
   * @param factor - any finite number, read as the decimal it prints as, or a plain decimal string (`"3.672500"`, an
   *   exchange rate or a 6-decimal unit price), read digit for digit.
   * @param rounding - the rounding mode; half-even by default.
   * @throws RangeError when `factor` is not finite or not a decimal, or the product is beyond the safe-integer limit.
   */
  times(factor: number | string, rounding: Rounding = Rounding.HalfEven): Money {
    const { numerator, denominator } = toRatio(factor, "factor");
    const product = roundQuotient(BigInt(this.minor) * numerator, denominator, rounding);
    return new Money(toSafeMinor(product), this.currency);
  }

  /**
   * This amount divided by `divisor` (months, people), rounded once to whole minor units. To split an amount with
   * nothing lost, use `allocate`.
   *
   * @param divisor - a finite non-zero number, read as the decimal it prints as, or a plain decimal string (`"1.15"`,
   *   one plus a tax rate), read digit for digit.
   * @param rounding - the rounding mode; half-even by default.
   * @throws RangeError when `divisor` is zero, not finite or not a decimal, or the quotient is beyond the safe-integer
   *   limit.
   */
  divide(divisor: number | string, rounding: Rounding = Rounding.HalfEven): Money {
    const { numerator, denominator } = toRatio(divisor, "divisor");
    if (numerator === 0n) throw new RangeError("Money.divide: the divisor is zero");
    const quotient = roundQuotient(BigInt(this.minor) * denominator, numerator, rounding);
    return new Money(toSafeMinor(quotient), this.currency);
  }

  /**
   * Splits this amount by `ratios` with nothing lost: the parts sum to this amount exactly. Each part is the exact
   * share rounded toward zero; the minor units left over go one each to the parts with the largest remainders, the
   * earlier part first on a tie, so the split is deterministic. A part with ratio 0 gets nothing.
   *
   * @param ratios - one non-negative finite weight per part, not all zero (`[1, 1, 1]`, `[70, 30]`, `[0.2, 0.8]`).
   * @returns one `Money` per ratio, in the same order and currency.
   * @throws RangeError when `ratios` is empty, a ratio is negative or not finite, or all ratios are zero.
   */
  allocate(ratios: readonly number[]): Money[] {
    if (ratios.length === 0) throw new RangeError("Money.allocate: give at least one ratio");
    const parts = ratios.map((ratio) => {
      if (ratio < 0)
        throw new RangeError(`Money.allocate: a ratio cannot be negative, got ${ratio}`);
      return toRatio(ratio, "ratio");
    });
    const scale = parts.reduce(
      (max, part) => (part.denominator > max ? part.denominator : max),
      1n,
    );
    const weights = parts.map((part) => part.numerator * (scale / part.denominator));
    const total = weights.reduce((sum, weight) => sum + weight, 0n);
    if (total === 0n) throw new RangeError("Money.allocate: the ratios sum to zero");
    const amount = BigInt(Math.abs(this.minor));
    const shares = weights.map((weight) => (amount * weight) / total);
    const left = amount - shares.reduce((sum, share) => sum + share, 0n);
    const bumped = new Set(
      weights
        .map((weight, index) => ({ index, remainder: (amount * weight) % total }))
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) =>
          a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
        )
        .slice(0, Number(left))
        .map(({ index }) => index),
    );
    const sign = this.minor < 0 ? -1n : 1n;
    return shares.map(
      (share, index) =>
        new Money(Number(sign * (bumped.has(index) ? share + 1n : share)), this.currency),
    );
  }

  /** Whether `other` is the same amount in the same currency. */
  equals(other: Money): boolean {
    return this.currency === other.currency && this.minor === other.minor;
  }

  /**
   * The amount as a plain decimal string with exactly the currency's exponent of fraction digits (`"12.50"`,
   * `"-0.05"`, `"1000"` for JPY, `"1.250"` for KWD): the form for JSON-LD offer prices and payment providers that
   * take decimals. Not localized; display goes through the i18n formatting hooks.
   */
  toDecimal(): string {
    const exponent = CURRENCIES[this.currency];
    if (exponent === 0) return String(this.minor);
    const digits = String(Math.abs(this.minor)).padStart(exponent + 1, "0");
    return `${this.minor < 0 ? "-" : ""}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
  }
}
