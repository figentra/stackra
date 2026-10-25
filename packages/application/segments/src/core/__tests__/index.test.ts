/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the two membership events and the kind refusal are its values, and
 *          nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as segments from "#core/index";

describe("@stackra/segments", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(segments).sort()).toEqual([
      "MembershipEntered",
      "MembershipLeft",
      "SegmentKindMismatchError",
    ]);
  });
});
