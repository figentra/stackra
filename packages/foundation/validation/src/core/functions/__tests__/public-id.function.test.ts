/**
 * Stackra file contract:
 * Purpose: unit and type tests of `publicId(prefix)`: the prefix and 26 Crockford base32 characters pass (either case,
 *          kept as given), anything else fails, the output keeps the `PublicId<P>` brand so `X$Check` holds, it composes
 *          with `.exactOptional()`, and a bad prefix throws when the schema is built.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0135; ADR 0294
 *                     (decision 26).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { publicId } from "#core/functions/public-id.function";
import type { Assert } from "#core/types/assert.type";
import type { Same } from "#core/types/same.type";

const ORDER = "ord_01j9z3k4m5n6p7q8r9s0t1v2w3";

describe("publicId()", () => {
  it.each([ORDER, "var_01JA0000000000000000000001"])("accepts %s and keeps it as given", (id) => {
    expect(publicId(id.slice(0, 3)).parse(id)).toBe(id);
  });

  it.each([
    "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
    "ord_01j9z3k4m5n6p7q8r9s0t1v2w",
    "ord_01j9z3k4m5n6p7q8r9s0t1v2w3x",
    "ord_01j9z3k4m5n6p7q8r9s0t1v2wu",
    "ord-01j9z3k4m5n6p7q8r9s0t1v2w3",
    42,
    null,
  ])("refuses %j as an order id", (value) => {
    expect(publicId("ord").safeParse(value).success).toBe(false);
  });

  it("types its output as the branded public id", () => {
    expectTypeOf<z.output<ReturnType<typeof publicId<"ord">>>>().toEqualTypeOf<PublicId<"ord">>();
    const shape = z.object({ orderId: publicId("ord") });
    type Check = Assert<Same<z.output<typeof shape>, { orderId: PublicId<"ord"> }>>;
    expectTypeOf<Check>().toEqualTypeOf<true>();
  });

  it("composes with exactOptional: absent passes, undefined does not", () => {
    const shape = z.object({ variantId: publicId("var").exactOptional() });
    expect(shape.safeParse({}).success).toBe(true);
    expect(shape.safeParse({ variantId: undefined }).success).toBe(false);
  });

  it.each(["o", "ORD", "orders1", "toolong", ""])("refuses the prefix %j", (prefix) => {
    expect(() => publicId(prefix)).toThrow(TypeError);
  });
});
