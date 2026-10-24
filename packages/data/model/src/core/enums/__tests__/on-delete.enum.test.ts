/**
 * Stackra file contract:
 * Purpose: unit tests of `OnDelete`: the three delete rules as snake_case codes in source order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16 Enum row); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OnDelete } from "#core/enums/on-delete.enum";

describe("OnDelete", () => {
  it("holds the delete rules", () => {
    expect(Enum.values(OnDelete)).toEqual(["cascade", "set_null", "restrict"]);
    const rule: OnDelete = OnDelete.SetNull;
    expect(rule).toBe("set_null");
  });
});
