/**
 * Stackra file contract:
 * Purpose: unit tests of `camelCase`, which names a route's id parameter and a facet's manifest key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (JSON keys are camelCase).
 */
import { describe, expect, it } from "@stackra/testing";

import { camelCase } from "#core/functions/camel-case.function";

describe("camelCase", () => {
  it("converts snake, Pascal and kebab names", () => {
    expect(camelCase("product_collection")).toBe("productCollection");
    expect(camelCase("LoyaltyAccount")).toBe("loyaltyAccount");
    expect(camelCase("access-logged")).toBe("accessLogged");
    expect(camelCase("order")).toBe("order");
  });
});
