/**
 * Stackra file contract:
 * Purpose: unit and type tests of `SettingType`: the five key types, with a connection id and no secret type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 and 23).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SettingType } from "#core/enums/setting-type.enum";

describe("SettingType", () => {
  it("names the five key types", () => {
    expect(Enum.values(SettingType)).toEqual([
      "boolean",
      "integer",
      "number",
      "string",
      "connection",
    ]);
  });

  it("types its codes", () => {
    expectTypeOf<SettingType>().toEqualTypeOf<
      "boolean" | "integer" | "number" | "string" | "connection"
    >();
  });
});
