/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PackIssueCode`: an `Enum.of` value with its snake_case codes in order and a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0417.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PackIssueCode } from "#core/enums/pack-issue-code.enum";

describe("PackIssueCode", () => {
  it("lists its codes", () => {
    expect(Enum.values(PackIssueCode)).toEqual([
      "key_unregistered",
      "key_undeclared",
      "value_invalid",
      "key_required",
      "floor_dropped",
      "floor_loosened",
    ]);
  });

  it("types one code", () => {
    expectTypeOf<PackIssueCode>().toEqualTypeOf<
      | "key_unregistered"
      | "key_undeclared"
      | "value_invalid"
      | "key_required"
      | "floor_dropped"
      | "floor_loosened"
    >();
  });
});
