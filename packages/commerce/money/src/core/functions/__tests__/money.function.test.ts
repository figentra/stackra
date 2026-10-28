/**
 * Stackra file contract:
 * Purpose: unit and type tests of `money()`: the wire form `{ minor, currency }` decodes to a `Money` and encodes back,
 *          a minor beyond MAX_SAFE_INTEGER or an unknown currency fails parsing, and `z.output` is exactly `Money`, so a
 *          generated `X$Check` holds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note;
 *                     ADR 0294 (decisions 26 and 27).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { money } from "#core/functions/money.function";
import { Money } from "#core/values/money.value";

/** `true` only when `A` and `B` are the same type, as the generated `Same` is. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe("money()", () => {
  it("decodes the wire form to a Money", () => {
    const value = money().parse({ minor: 1250, currency: "USD" });
    expect(value).toBeInstanceOf(Money);
    expect(value.minor).toBe(1250);
    expect(value.currency).toBe("USD");
  });

  it("encodes a Money to the wire form", () => {
    expect(z.encode(money(), Money.ofMinor(1250, "USD"))).toEqual({
      minor: 1250,
      currency: "USD",
    });
  });

  it.each([
    { minor: 0, currency: "JPY" },
    { minor: -5, currency: "USD" },
    { minor: Number.MAX_SAFE_INTEGER, currency: "KWD" },
  ])("round-trips %j", (wire) => {
    expect(z.encode(money(), money().parse(wire))).toEqual(wire);
  });

  it.each([
    { minor: Number.MAX_SAFE_INTEGER + 1, currency: "USD" },
    { minor: -Number.MAX_SAFE_INTEGER - 1, currency: "USD" },
    { minor: 12.5, currency: "USD" },
    { minor: "1250", currency: "USD" },
    { minor: 1250, currency: "usd" },
    { minor: 1250, currency: "XXX" },
    { minor: 1250 },
    null,
    1250,
  ])("refuses %j", (wire) => {
    expect(money().safeParse(wire).success).toBe(false);
  });

  it("accepts a Money already in hand and returns an equal new value", () => {
    const price = Money.ofMinor(999, "EUR");
    const parsed = money().parse(price);
    expect(parsed.equals(price)).toBe(true);
    expect(parsed).not.toBe(price);
  });

  it("works as a field of a generated object schema", () => {
    const OrderLine$ = z.object({ quantity: z.number().int().min(1), unitPrice: money() });
    const line = OrderLine$.parse({ quantity: 2, unitPrice: { minor: 1250, currency: "USD" } });
    expect(line.unitPrice.toDecimal()).toBe("12.50");
    expect(z.encode(OrderLine$, line)).toEqual({
      quantity: 2,
      unitPrice: { minor: 1250, currency: "USD" },
    });
  });

  it("refuses to encode something that is not a Money", () => {
    expect(() => z.encode(money(), { minor: 1, currency: "USD" } as unknown as Money)).toThrow();
  });

  it("outputs exactly Money", () => {
    const exact: Same<z.output<ReturnType<typeof money>>, Money> = true;
    expect(exact).toBe(true);
  });
});
