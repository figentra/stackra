/**
 * Stackra file contract:
 * Purpose: type tests of `Assert<T>`: it accepts `true` and refuses anything else at its use site, as a generated
 *          `X$Check` relies on.
 * Boundary: test only; type assertions, with one runtime assertion so the file runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import type { Assert } from "#core/types/assert.type";
import type { Fields } from "#core/types/fields.type";
import type { Same } from "#core/types/same.type";

class RequestedLine {
  variantId!: string;

  quantity!: number;
}

const RequestedLine$ = z.object({ variantId: z.string(), quantity: z.number().int() });

describe("Assert", () => {
  it("accepts true, as a passing X$Check", () => {
    type RequestedLine$Check = Assert<Same<z.output<typeof RequestedLine$>, Fields<RequestedLine>>>;
    expectTypeOf<RequestedLine$Check>().toEqualTypeOf<true>();
  });

  it("refuses false, as a failing X$Check", () => {
    // @ts-expect-error -- the schema has no `note`, the class does
    type Drifted = Assert<Same<z.output<typeof RequestedLine$>, { note: string }>>;
    expectTypeOf<Drifted>().not.toBeNever();
    expect(RequestedLine$.parse({ variantId: "v", quantity: 1 }).quantity).toBe(1);
  });
});
