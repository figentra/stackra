/**
 * Stackra file contract:
 * Purpose: `Quantity`, an amount with its unit (`2.5 m`, `750 g`, `12 piece`) and exact arithmetic: conversion between
 *          units of one dimension, addition, subtraction, scaling and comparison never round, because the amount is
 *          kept as a reduced fraction of big integers. Rounding happens once, when the caller asks for a decimal.
 * Boundary: an immutable value class, built with `Quantity.of`. Units of different dimensions never mix (a
 *           `TypeError`). Which unit a Market sells or shows in is market-pack data, never a default here. No
 *           dependency, no host global.
 * Runtime: isomorphic
 *           `roundTo` and `priceMinor` round once, to a caller-given step or to whole minor units, by a caller-given
 *           mode (both settings or market-pack values); money stays a big integer of minor units, never a float.
 * Governing contract: ADR 0305 (one declaration per file); COM-76 (sell by weight, length or volume); COM-77 (unit
 *                     price where the Market requires it); STA-934 (rounding per unit, weighed prices).
 */
import { QUANTITY_UNITS } from "#core/constants/quantity-units.constant";
import { parseDecimal } from "#core/functions/parse-decimal.function";
import { rational } from "#core/functions/rational.function";
import { roundRational } from "#core/functions/round-rational.function";
import type { QuantityRounding } from "#core/types/quantity-rounding.type";
import type { QuantityUnit } from "#core/types/quantity-unit.type";
import type { Rational } from "#core/types/rational.type";

/** The exact factor of `unit` to its dimension's base unit. */
function factorOf(unit: QuantityUnit): Rational {
  if (!Object.hasOwn(QUANTITY_UNITS, unit))
    throw new RangeError(`Quantity: "${String(unit)}" is not a known unit`);
  return parseDecimal(QUANTITY_UNITS[unit].factor);
}

/**
 * An exact amount of a unit.
 *
 * @example
 * const fabric = Quantity.of("2.5", "yd");
 * fabric.to("m").toDecimal(4); // "2.2860"
 * Quantity.of("750", "g").add(Quantity.of("1", "kg")).toDecimal(0); // "1750"
 */
export class Quantity {
  /** The unit the amount is counted in. */
  readonly unit: QuantityUnit;

  /** The exact amount in `unit`. */
  readonly amount: Rational;

  /** Use `Quantity.of`. */
  private constructor(amount: Rational, unit: QuantityUnit) {
    this.amount = amount;
    this.unit = unit;
    Object.freeze(this);
  }

  /**
   * A quantity of `amount` `unit`.
   *
   * @param amount - a decimal string, a safe integer or a big integer; never a fractional `number`.
   * @throws RangeError when the amount is not exact or the unit is unknown.
   */
  static of(amount: string | number | bigint, unit: QuantityUnit): Quantity {
    factorOf(unit);
    return new Quantity(parseDecimal(amount), unit);
  }

  /** What the unit measures. */
  get dimension(): (typeof QUANTITY_UNITS)[QuantityUnit]["dimension"] {
    return QUANTITY_UNITS[this.unit].dimension;
  }

  /**
   * The same quantity in `unit`, exactly.
   *
   * @throws TypeError when `unit` measures another dimension.
   */
  to(unit: QuantityUnit): Quantity {
    const from = factorOf(this.unit);
    const to = factorOf(unit);
    if (QUANTITY_UNITS[unit].dimension !== this.dimension)
      throw new TypeError(`Quantity: cannot convert ${this.unit} to ${unit}`);
    return new Quantity(
      rational(this.amount.num * from.num * to.den, this.amount.den * from.den * to.num),
      unit,
    );
  }

  /** This plus `other`, in this unit. */
  add(other: Quantity): Quantity {
    const { num, den } = other.to(this.unit).amount;
    return new Quantity(
      rational(this.amount.num * den + num * this.amount.den, this.amount.den * den),
      this.unit,
    );
  }

  /** This minus `other`, in this unit. */
  subtract(other: Quantity): Quantity {
    const { num, den } = other.to(this.unit).amount;
    return this.add(new Quantity(rational(-num, den), this.unit));
  }

  /**
   * This times `factor` (a count of items, a share), exactly.
   *
   * @param factor - a decimal string, a safe integer or a big integer.
   */
  times(factor: string | number | bigint): Quantity {
    const { num, den } = parseDecimal(factor);
    return new Quantity(rational(this.amount.num * num, this.amount.den * den), this.unit);
  }

  /**
   * How many of `per` fit in this quantity, exactly (the divisor of a unit price: `1.5 kg` per `100 g` is `15`).
   *
   * @throws RangeError when `per` is zero.
   */
  ratio(per: Quantity): Rational {
    const { num, den } = per.to(this.unit).amount;
    if (num === 0n) throw new RangeError("Quantity: cannot divide by a zero quantity");
    return rational(this.amount.num * den, this.amount.den * num);
  }

  /**
   * This rounded to a whole multiple of `step`, in this unit (a scale's division: `1.237 kg` to `5 g` is `1.235 kg`).
   *
   * @param step - the increment, of this dimension and above zero; it is a setting or market-pack value.
   * @param mode - `half_up` (default), `down` or `up`.
   * @throws RangeError when `step` is zero or negative; TypeError when it measures another dimension.
   */
  roundTo(step: Quantity, mode: QuantityRounding = "half_up"): Quantity {
    const size = step.to(this.unit).amount;
    if (size.num <= 0n) throw new RangeError("Quantity: the rounding step must be above zero");
    const count = roundRational(this.ratio(step), mode);
    return new Quantity(rational(count * size.num, size.den), this.unit);
  }

  /**
   * The price of this quantity in whole minor units, given `pricePerMinor` minor units per `per`, rounded once
   * (`1.235 kg` at `1299` per `1 kg` is `1604`). Money never passes through a float.
   *
   * @param pricePerMinor - minor units per `per`: a big integer or a safe integer.
   * @param mode - `half_up` (default), `down` or `up`; the Market's rule is the caller's.
   * @throws RangeError when the price is not a whole number or `per` is zero; TypeError on another dimension.
   */
  priceMinor(
    pricePerMinor: bigint | number,
    per: Quantity,
    mode: QuantityRounding = "half_up",
  ): bigint {
    if (typeof pricePerMinor === "number" && !Number.isSafeInteger(pricePerMinor))
      throw new RangeError(`Quantity: a price must be whole minor units, got ${pricePerMinor}`);
    const { num, den } = this.ratio(per);
    return roundRational(rational(num * BigInt(pricePerMinor), den), mode);
  }

  /** Negative, zero or positive as this is less than, equal to or more than `other`. */
  compare(other: Quantity): -1 | 0 | 1 {
    const { num, den } = other.to(this.unit).amount;
    const left = this.amount.num * den;
    const right = num * this.amount.den;
    return left < right ? -1 : left > right ? 1 : 0;
  }

  /** Whether this equals `other`, whatever the units. */
  equals(other: Quantity): boolean {
    return other.dimension === this.dimension && this.compare(other) === 0;
  }

  /**
   * The amount as a decimal string with `places` fraction digits, rounded half away from zero once, here.
   *
   * @throws RangeError when `places` is not a whole number from 0.
   */
  toDecimal(places: number): string {
    if (!Number.isInteger(places) || places < 0)
      throw new RangeError(`Quantity: places must be a whole number from 0, got ${places}`);
    const scale = 10n ** BigInt(places);
    const negative = this.amount.num < 0n;
    const scaled = (negative ? -this.amount.num : this.amount.num) * scale;
    let units = scaled / this.amount.den;
    if ((scaled % this.amount.den) * 2n >= this.amount.den) units += 1n;
    const digits = units.toString().padStart(places + 1, "0");
    const whole = digits.slice(0, digits.length - places);
    const fraction = places === 0 ? "" : `.${digits.slice(-places)}`;
    return `${negative && units !== 0n ? "-" : ""}${whole}${fraction}`;
  }

  /** `"<decimal> <unit>"` with up to six fraction digits, for logs and tests. */
  toString(): string {
    return `${this.toDecimal(6).replace(/\.?0+$/, "")} ${this.unit}`;
  }
}
