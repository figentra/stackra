/**
 * Stackra file contract:
 * Purpose: unit tests of `KitStatus`: the five review states, as the codes the kit checker already accepts.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { KitStatus } from "#contracts/enums/kit-status.enum";

describe("KitStatus", () => {
  it("lists the review states", () => {
    expect(Enum.values(KitStatus)).toEqual([
      "approved",
      "proposed",
      "rejected",
      "superseded",
      "retired",
    ]);
    expectTypeOf<KitStatus>().toEqualTypeOf<
      "approved" | "proposed" | "rejected" | "superseded" | "retired"
    >();
  });
});
