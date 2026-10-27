/**
 * Stackra file contract:
 * Purpose: unit tests of `Endorsement`: the two endorsement lines, as the codes kit files already hold.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Endorsement } from "#contracts/enums/endorsement.enum";

describe("Endorsement", () => {
  it("lists by and powered-by", () => {
    expect(Enum.values(Endorsement)).toEqual(["by", "powered-by"]);
    expectTypeOf<Endorsement>().toEqualTypeOf<"by" | "powered-by">();
  });
});
