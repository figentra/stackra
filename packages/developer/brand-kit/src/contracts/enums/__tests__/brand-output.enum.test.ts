/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandOutput`: the eight generated file kinds, in order, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BrandOutput } from "#contracts/enums/brand-output.enum";

describe("BrandOutput", () => {
  it("lists the generated file kinds", () => {
    expect(Enum.values(BrandOutput)).toEqual([
      "tokens",
      "heroui_css",
      "app_icon",
      "adaptive_icon",
      "splash",
      "favicon",
      "web_manifest",
      "store_frame",
    ]);
    expectTypeOf<BrandOutput>().toEqualTypeOf<
      | "tokens"
      | "heroui_css"
      | "app_icon"
      | "adaptive_icon"
      | "splash"
      | "favicon"
      | "web_manifest"
      | "store_frame"
    >();
  });
});
