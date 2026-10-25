/**
 * Stackra file contract:
 * Purpose: unit tests of `ConfigInvalidError`: a plain `Error` (not a refusal) whose message lists each path and what
 *          is wrong, with frozen issues and the configuration name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0146 (consequences).
 */
import { describe, expect, it } from "@stackra/testing";

import { ConfigInvalidError } from "#core/errors/config-invalid.error";

describe("ConfigInvalidError", () => {
  it("names the configuration and every path in its message", () => {
    const error = new ConfigInvalidError("CommerceConfig", [
      { path: "storefrontBaseUrl", message: "Invalid URL (STACKRA_STOREFRONT_BASE_URL)" },
      { path: "pricingApiKey", message: "secret PRICING_API_KEY is missing or invalid" },
    ]);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ConfigInvalidError");
    expect(error.config).toBe("CommerceConfig");
    expect(error.message).toBe(
      "CommerceConfig is invalid: storefrontBaseUrl: Invalid URL (STACKRA_STOREFRONT_BASE_URL); " +
        "pricingApiKey: secret PRICING_API_KEY is missing or invalid",
    );
  });

  it("keeps a frozen copy of the issues", () => {
    const issues = [{ path: "x", message: "is not set" }];
    const error = new ConfigInvalidError("env", issues);
    issues.push({ path: "y", message: "is not set" });
    expect(error.issues).toEqual([{ path: "x", message: "is not set" }]);
    expect(Object.isFrozen(error.issues)).toBe(true);
  });
});
