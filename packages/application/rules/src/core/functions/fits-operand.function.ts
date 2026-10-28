/**
 * Stackra file contract:
 * Purpose: `fitsOperand(field, operator, value)`, whether a leaf's value is what its operator takes for its field's
 *          type: nothing, one element, 1 to 100 elements, an ordered range of two, a positive duration, or a circle.
 * Boundary: internal to the package; `Rules.problems` calls it after it has checked that the operator is in the field
 *           type's set. Elements are a string of at most 1,000 characters (string and list), a finite number, a money
 *           amount, an ISO 8601 instant with its offset, or one of an enum field's codes; a range's two money amounts
 *           share a currency. It never reads a fact.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 3 and 10).
 */
import { Enum } from "@stackra/contracts";
import { isoDateTime } from "@stackra/validation";
import { isRecord } from "@stackra/support";

import { type FactField, FieldType, Operator } from "#contracts/index";
import { millisecondsOf } from "#core/functions/milliseconds-of.function";
import { moneyOf } from "#core/functions/money-of.function";

/** The most elements a many-valued operand holds. */
const MAX_ITEMS = 100;

/** The longest string element. */
const MAX_TEXT = 1000;

/** An ISO 8601 instant with its offset (the codec also takes a `Date`, which JSON never holds). */
const INSTANT = isoDateTime();

/** Whether `value` is a finite number in `[low, high]`. */
const within = (value: unknown, low: number, high: number): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= low && value <= high;

/** Whether `value` is one element of `field`'s type. */
function fitsElement(field: FactField, value: unknown): boolean {
  switch (field.type) {
    case FieldType.String:
    case FieldType.List: {
      return typeof value === "string" && value.length <= MAX_TEXT;
    }
    case FieldType.Number: {
      return typeof value === "number" && Number.isFinite(value);
    }
    case FieldType.Money: {
      return moneyOf(value) !== undefined;
    }
    case FieldType.Date: {
      return typeof value === "string" && INSTANT.safeParse(value).success;
    }
    case FieldType.Enum: {
      return typeof value === "string" && Object.hasOwn(field.values ?? {}, value);
    }
    default: {
      return false;
    }
  }
}

/** Whether `value` is two elements of `field`'s type, the first not above the second. */
function fitsRange(field: FactField, value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [low, high] = value as readonly unknown[];
  if (!fitsElement(field, low) || !fitsElement(field, high)) return false;
  if (field.type === FieldType.Money) {
    const [from, to] = [moneyOf(low), moneyOf(high)];
    return (
      from !== undefined &&
      to !== undefined &&
      from.currency === to.currency &&
      from.minor <= to.minor
    );
  }
  if (field.type === FieldType.Date) return Date.parse(String(low)) <= Date.parse(String(high));
  return Number(low) <= Number(high);
}

/**
 * Whether `value` fits `operator` on `field`.
 *
 * @example
 * fitsOperand({ type: FieldType.Number, label }, Operator.Between, [1, 5]); // true
 */
export function fitsOperand(field: FactField, operator: Operator, value: unknown): boolean {
  switch (Enum.meta(Operator, operator).operand) {
    case "none": {
      return value === undefined;
    }
    case "one": {
      return fitsElement(field, value);
    }
    case "many": {
      return (
        Array.isArray(value) &&
        value.length >= 1 &&
        value.length <= MAX_ITEMS &&
        (value as readonly unknown[]).every((item) => fitsElement(field, item))
      );
    }
    case "range": {
      return fitsRange(field, value);
    }
    case "duration": {
      return millisecondsOf(value) !== undefined;
    }
    case "circle": {
      return (
        isRecord(value, ["latitude", "longitude", "radiusKilometres"]) &&
        within(value["latitude"], -90, 90) &&
        within(value["longitude"], -180, 180) &&
        within(value["radiusKilometres"], Number.MIN_VALUE, Number.MAX_VALUE)
      );
    }
    default: {
      return false;
    }
  }
}
