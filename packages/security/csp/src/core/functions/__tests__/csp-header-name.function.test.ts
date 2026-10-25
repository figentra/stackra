/**
 * Stackra file contract:
 * Purpose: unit and type tests of `cspHeaderName`: the enforcing header by default, the report-only header while the
 *          configuration rolls out, and a literal return type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";
import { cspHeaderName } from "#core/functions/csp-header-name.function";

/** A host rolling the policy out. */
class RolloutCspConfig extends CspConfig {
  override reportOnly = true;
}

describe("cspHeaderName", () => {
  it("enforces by default", () => {
    expect(cspHeaderName(new CspConfig())).toBe("Content-Security-Policy");
  });

  it("reports only while the configuration says so", () => {
    expect(cspHeaderName(new RolloutCspConfig())).toBe("Content-Security-Policy-Report-Only");
  });

  it("returns one of the two header names", () => {
    expectTypeOf(cspHeaderName).returns.toEqualTypeOf<
      "Content-Security-Policy" | "Content-Security-Policy-Report-Only"
    >();
  });
});
