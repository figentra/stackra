/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Idempotency`: an `Enum.of` enum holding the Idempotency-Key policies of ADR 0136, codes in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Idempotency } from "#core/enums/idempotency.enum";

describe("Idempotency", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(Idempotency)).toEqual(["optional", "required", "derived"]);
    expect(Idempotency.Optional).toBe("optional");
    expect(Idempotency.Required).toBe("required");
    expect(Idempotency.Derived).toBe("derived");
  });

  it("types its values", () => {
    expectTypeOf<Idempotency>().toEqualTypeOf<"optional" | "required" | "derived">();
  });
});
