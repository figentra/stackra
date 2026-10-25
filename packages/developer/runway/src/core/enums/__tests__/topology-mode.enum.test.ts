/**
 * Stackra file contract:
 * Purpose: unit tests of `TopologyMode`: monolith, grouped and split.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { TopologyMode } from "#core/enums/topology-mode.enum";

describe("TopologyMode", () => {
  it("lists the three modes", () => {
    expect(Enum.values(TopologyMode)).toEqual(["monolith", "grouped", "split"]);
    expectTypeOf<TopologyMode>().toEqualTypeOf<"monolith" | "grouped" | "split">();
  });
});
