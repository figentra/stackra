/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SettingSource`: default, layer, floor and entitlement.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 2: provenance); ADR 0420 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingSource } from "#contracts/enums/setting-source.enum";

describe("SettingSource", () => {
  it("names the four sources", () => {
    expect(Enum.values(SettingSource)).toEqual(["default", "layer", "floor", "entitlement"]);
  });

  it("types its codes", () => {
    expectTypeOf<SettingSource>().toEqualTypeOf<"default" | "layer" | "floor" | "entitlement">();
  });
});
