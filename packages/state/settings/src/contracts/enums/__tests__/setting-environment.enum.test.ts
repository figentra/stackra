/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SettingEnvironment`: live, sandbox and setup.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decisions 3 to 5).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingEnvironment } from "#contracts/enums/setting-environment.enum";

describe("SettingEnvironment", () => {
  it("names the three environments", () => {
    expect(Enum.values(SettingEnvironment)).toEqual(["live", "sandbox", "setup"]);
  });

  it("types its codes", () => {
    expectTypeOf<SettingEnvironment>().toEqualTypeOf<"live" | "sandbox" | "setup">();
  });
});
