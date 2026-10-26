/**
 * Stackra file contract:
 * Purpose: unit tests of `PLATFORM_PARTNERS`: `RuleSetService` is typed against `RuleSet`, every key also has a
 *          `PLATFORM_BINDINGS` row, and the map is frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 5); ADR 0331.
 */
import { describe, expect, it } from "@stackra/testing";

import { PLATFORM_BINDINGS } from "#core/constants/platform-bindings.constant";
import { PLATFORM_PARTNERS } from "#core/constants/platform-partners.constant";

describe("PLATFORM_PARTNERS", () => {
  it("names the model of each platform CrudService gen binds", () => {
    expect(PLATFORM_PARTNERS).toEqual({
      "@stackra/rules#RuleSetService": { name: "RuleSet", from: "@stackra/rules/node" },
    });
    for (const key of Object.keys(PLATFORM_PARTNERS)) expect(PLATFORM_BINDINGS[key]).toBeDefined();
    expect(Object.isFrozen(PLATFORM_PARTNERS)).toBe(true);
  });
});
