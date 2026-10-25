/**
 * Stackra file contract:
 * Purpose: unit tests of `LocaleUrlStrategy`: the two strategies with snake_case codes and the template's case name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0297 (decision 4); ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LocaleUrlStrategy } from "#core/enums/locale-url-strategy.enum";

describe("LocaleUrlStrategy", () => {
  it("holds the two strategies with snake_case codes", () => {
    expect(Enum.values(LocaleUrlStrategy)).toEqual(["prefix_except_default", "prefix"]);
    expect(LocaleUrlStrategy.PrefixExceptDefault).toBe("prefix_except_default");
  });
});
