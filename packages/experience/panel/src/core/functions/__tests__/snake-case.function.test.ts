/**
 * Stackra file contract:
 * Purpose: unit tests of `snakeCase`: PascalCase and camelCase names become snake_case codes, digits stay with their word.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231.
 */
import { describe, expect, it } from "@stackra/testing";

import { snakeCase } from "#core/functions/snake-case.function";

describe("snakeCase", () => {
  it("writes snake_case", () => {
    expect(snakeCase("SalesOverview")).toBe("sales_overview");
    expect(snakeCase("Dashboard")).toBe("dashboard");
    expect(snakeCase("Column1")).toBe("column1");
    expect(snakeCase("LoyaltyKit")).toBe("loyalty_kit");
    expect(snakeCase("APIKeys")).toBe("api_keys");
  });
});
