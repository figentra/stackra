/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PackRejection`: an `Enum.of` value with its snake_case codes in order and a same-named type.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PackRejection } from "#core/enums/pack-rejection.enum";

describe("PackRejection", () => {
  it("lists its codes", () => {
    expect(Enum.values(PackRejection)).toEqual([
      "shape_invalid",
      "hash_mismatch",
      "key_unknown",
      "signature_invalid",
      "overlay_cycle",
      "not_stored",
    ]);
  });

  it("types one code", () => {
    expectTypeOf<PackRejection>().toEqualTypeOf<
      | "shape_invalid"
      | "hash_mismatch"
      | "key_unknown"
      | "signature_invalid"
      | "overlay_cycle"
      | "not_stored"
    >();
  });
});
