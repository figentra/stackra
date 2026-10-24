/**
 * Stackra file contract:
 * Purpose: unit and type tests of `json()`: JSON values pass unchanged, values that are not JSON fail, and the output
 *          is the contracts `Json`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import { json } from "#core/functions/json.function";

describe("json()", () => {
  it.each([null, true, 3.5, "text", [1, "a", null], { actor: { id: "usr_1", onBehalfOf: [] } }])(
    "accepts %j",
    (value) => {
      expect(json().parse(value)).toEqual(value);
    },
  );

  it.each([undefined, () => 1, new Date(0), Symbol("s")])("refuses %s", (value) => {
    expect(json().safeParse(value).success).toBe(false);
  });

  it("outputs Json", () => {
    expectTypeOf<z.output<ReturnType<typeof json>>>().toEqualTypeOf<Json>();
  });
});
