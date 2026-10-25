/**
 * Stackra file contract:
 * Purpose: unit and conformance tests of `configKeyOf`: the member key for the class named after the member,
 *          `<member>.<stem>` otherwise, and the same key @stackra/config's runtime `configKey` derives from the class
 *          (the registry's "one derivation, conformance test" rule).
 * Boundary: test only; builds two real config classes with @stackra/config and @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20: config key); ADR 0305 (rule 34).
 */
import { Config, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { configKeyOf } from "#core/functions/config-key-of.function";

describe("configKeyOf", () => {
  it("derives the member key or `<member>.<stem>`", () => {
    expect(configKeyOf("LoyaltyKitConfig", "loyalty_kit")).toBe("loyalty_kit");
    expect(configKeyOf("RateLimitConfig", "commerce")).toBe("commerce.rate_limit");
  });

  it("agrees with the runtime derivation of @stackra/config", () => {
    class Options extends Schema {
      ledger = "memory";
    }
    class LoyaltyKitConfig extends Config({ schema: Options }) {}
    class RateLimitConfig extends Config({ schema: Options }) {}

    expect(configKeyOf(LoyaltyKitConfig.name, "loyalty_kit")).toBe(
      configKey(LoyaltyKitConfig, "loyalty_kit"),
    );
    expect(configKeyOf(RateLimitConfig.name, "commerce")).toBe(
      configKey(RateLimitConfig, "commerce"),
    );
  });
});
