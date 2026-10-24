/**
 * Stackra file contract:
 * Purpose: `MinorUnitsType`, the ORM column type of `Money#minor`: a Postgres `bigint` read as a JavaScript `number`,
 *          refusing a value beyond `Number.MAX_SAFE_INTEGER` in either direction instead of rounding it.
 * Boundary: a MikroORM custom type over the ORM's `BigIntType` in number mode, which converts without a check; this
 *           adds the check. Internal: `MoneySchema` uses it, gen never names it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 27: the money type refuses a value above `Number.MAX_SAFE_INTEGER`);
 *                     ADR 0220 (minor units).
 */
import { BigIntType } from "@mikro-orm/core";

/** Refuses a minor amount that is not a safe integer. */
function assertSafe(value: number | null | undefined): number | null | undefined {
  if (value !== null && value !== undefined && !Number.isSafeInteger(value))
    throw new RangeError(`Money: ${value} minor units is beyond Number.MAX_SAFE_INTEGER`);
  return value;
}

/**
 * The `bigint` column of an amount in minor units.
 *
 * @example
 * minor: { type: new MinorUnitsType() },
 */
export class MinorUnitsType extends BigIntType<"number"> {
  constructor() {
    super("number");
  }

  /** A safe-integer amount to the stored decimal text. */
  override convertToDatabaseValue(value: number | null | undefined): string | null | undefined {
    return super.convertToDatabaseValue(assertSafe(value));
  }

  /** The stored `bigint` to a safe-integer `number`. */
  override convertToJSValue(value: string | bigint | null | undefined): number | null | undefined {
    // A value beyond 2^53 converts to a number at or beyond 2^53, which is never a safe integer.
    return value === null || value === undefined ? value : assertSafe(Number(value));
  }
}
