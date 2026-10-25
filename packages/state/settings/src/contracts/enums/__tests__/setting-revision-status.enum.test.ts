/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SettingRevisionStatus`: pending, scheduled, applied and rejected.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingRevisionStatus } from "#contracts/enums/setting-revision-status.enum";

describe("SettingRevisionStatus", () => {
  it("names the four states", () => {
    expect(Enum.values(SettingRevisionStatus)).toEqual([
      "pending",
      "scheduled",
      "applied",
      "rejected",
    ]);
  });

  it("types its codes", () => {
    expectTypeOf<SettingRevisionStatus>().toEqualTypeOf<
      "pending" | "scheduled" | "applied" | "rejected"
    >();
  });
});
