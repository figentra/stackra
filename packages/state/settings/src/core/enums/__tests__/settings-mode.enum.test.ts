/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SettingsMode`: developer and normal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingsMode } from "#core/enums/settings-mode.enum";

describe("SettingsMode", () => {
  it("names the two modes", () => {
    expect(Enum.values(SettingsMode)).toEqual(["developer", "normal"]);
  });

  it("types its codes", () => {
    expectTypeOf<SettingsMode>().toEqualTypeOf<"developer" | "normal">();
  });
});
