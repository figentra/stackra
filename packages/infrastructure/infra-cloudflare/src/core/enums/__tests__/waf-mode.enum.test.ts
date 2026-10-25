/**
 * Stackra file contract:
 * Purpose: unit tests of `WafMode`: managed and off.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0217 (decision 3).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WafMode } from "#core/enums/waf-mode.enum";

describe("WafMode", () => {
  it("lists the two modes", () => {
    expect(Enum.values(WafMode)).toEqual(["managed", "off"]);
    expectTypeOf<WafMode>().toEqualTypeOf<"managed" | "off">();
  });
});
