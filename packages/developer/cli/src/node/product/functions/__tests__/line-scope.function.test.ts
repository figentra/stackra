/**
 * Stackra file contract:
 * Purpose: unit tests of `lineScope`: the flag first, then `STACKRA_LINE_SCOPE`, then the product packages' scope,
 *          and a refusal when nothing names one.
 * Boundary: test only; sets and restores one environment variable.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0481 (decision 4).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { lineScope } from "#node/product/functions/line-scope.function";

afterEach(() => {
  delete process.env["STACKRA_LINE_SCOPE"];
});

describe("lineScope", () => {
  it("takes the flag, then the environment, then the packages' scope", () => {
    process.env["STACKRA_LINE_SCOPE"] = "@env";
    expect(lineScope("@flag", ["@figentra/a"])).toBe("@flag");
    expect(lineScope(undefined, ["@figentra/a"])).toBe("@env");
    delete process.env["STACKRA_LINE_SCOPE"];
    expect(lineScope(undefined, ["plain", "@figentra/a"])).toBe("@figentra");
  });

  it("refuses when nothing names a scope", () => {
    expect(() => lineScope(undefined, ["plain"])).toThrow(CliUsageError);
  });
});
