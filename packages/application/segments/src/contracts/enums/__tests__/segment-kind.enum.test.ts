/**
 * Stackra file contract:
 * Purpose: unit tests of `SegmentKind`: exactly the two codes `dynamic` and `manual`, typed as their union.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SegmentKind } from "#contracts/enums/segment-kind.enum";

describe("SegmentKind", () => {
  it("has the dynamic and manual codes", () => {
    expect(Enum.values(SegmentKind)).toEqual(["dynamic", "manual"]);
    expect(SegmentKind.Dynamic).toBe("dynamic");
    expect(SegmentKind.Manual).toBe("manual");
    expectTypeOf<SegmentKind>().toEqualTypeOf<"dynamic" | "manual">();
  });
});
