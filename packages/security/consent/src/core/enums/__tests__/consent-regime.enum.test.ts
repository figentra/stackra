/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentRegime`: opt-in `gdpr` and opt-out `ccpa`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 16); ADR 0298 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ConsentRegime } from "#core/enums/consent-regime.enum";

describe("ConsentRegime", () => {
  it("lists the regimes in order", () => {
    expect(Enum.values(ConsentRegime)).toEqual(["gdpr", "ccpa"]);
    expectTypeOf<ConsentRegime>().toEqualTypeOf<"gdpr" | "ccpa">();
  });
});
