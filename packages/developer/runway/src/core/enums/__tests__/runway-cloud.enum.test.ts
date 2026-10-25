/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RunwayCloud`: an `Enum.of` enum of the two clouds of ADR 0354, codes in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RunwayCloud } from "#core/enums/runway-cloud.enum";

describe("RunwayCloud", () => {
  it("holds the two clouds in order", () => {
    expect(Enum.values(RunwayCloud)).toEqual(["aws", "gcp"]);
  });

  it("types its values", () => {
    expectTypeOf<RunwayCloud>().toEqualTypeOf<"aws" | "gcp">();
  });
});
