/**
 * Stackra file contract:
 * Purpose: `money()`, the zod codec generated schemas write for a field typed `Money` (`subtotal: money()`): the wire
 *          form `{ minor, currency }` decodes to a `Money` and a `Money` encodes back to it.
 * Boundary: a codec from a plain object (minor: a safe integer, currency: `currencyCode()`) to a `Money` instance, so
 *           `z.output` is exactly `Money` and the generated `X$Check` holds. zod 4's `z.int()` accepts safe integers
 *           only, so a wire value beyond `Number.MAX_SAFE_INTEGER` fails parsing. A `Money` given to `parse` passes too
 *           (its own fields are the wire form) and comes back as an equal new value. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0127 2026-10-24 note (the money codecs ship from @stackra/money); ADR 0294 (decision 26:
 *                     the shape compiler and codecs; decision 27: the safe-integer limit); ADR 0220 (decision 1).
 */
import { z } from "zod";

import { currencyCode } from "#core/functions/currency-code.function";
import { Money } from "#core/values/money.value";

/**
 * A new zod codec between the wire form `{ minor: number, currency: string }` and a `Money`.
 *
 * @example
 * export const OrderLine$ = z.object({ quantity: z.number().int().min(1), unitPrice: money() });
 * OrderLine$.parse({ quantity: 2, unitPrice: { minor: 1250, currency: "USD" } }).unitPrice.toDecimal(); // "12.50"
 * z.encode(money(), Money.ofMinor(1250, "USD")); // { minor: 1250, currency: "USD" }
 */
export function money(): z.ZodCodec<
  z.ZodObject<{ minor: z.ZodInt; currency: ReturnType<typeof currencyCode> }, z.core.$strip>,
  z.ZodCustom<Money, Money>
> {
  return z.codec(
    z.object({ minor: z.int(), currency: currencyCode() }),
    z.custom<Money>((value) => value instanceof Money, { message: "Expected a Money" }),
    {
      decode: ({ minor, currency }) => Money.ofMinor(minor, currency),
      encode: (value) => ({ minor: value.minor, currency: value.currency }),
    },
  );
}
