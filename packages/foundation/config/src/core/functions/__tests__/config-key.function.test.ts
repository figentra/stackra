/**
 * Stackra file contract:
 * Purpose: unit tests of `configKey`, the derivation of ADR 0294 decision 20: the member key for the file named after
 *          the member, `<member>.<snake(stem)>` otherwise, and a host override inherits its base's key; the keys the
 *          template's configuration classes lock.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { Config } from "#core/bases/config.base";
import { configKey } from "#core/functions/config-key.function";

class Options extends Schema {
  enabled = true;
}

class LoyaltyKitConfig extends Config({ schema: Options }) {}
class DeliveryConfig extends Config({ schema: Options }) {}
class RateLimitConfig extends Config({ schema: Options }) {}
class EnvConfig extends Config({ schema: Options }) {}

const BaseLoyaltyKitConfig = LoyaltyKitConfig;

class HostLoyaltyKitConfig extends BaseLoyaltyKitConfig {
  override enabled = false;
}

describe("configKey", () => {
  it("is the member key for the file named after the member", () => {
    expect(configKey(LoyaltyKitConfig, "loyalty_kit")).toBe("loyalty_kit");
  });

  it("is <member>.<snake(stem)> otherwise", () => {
    expect(configKey(DeliveryConfig, "notifications")).toBe("notifications.delivery");
    expect(configKey(RateLimitConfig, "commerce")).toBe("commerce.rate_limit");
    expect(configKey(EnvConfig, "web")).toBe("web.env");
  });

  it("gives a host override its base's key", () => {
    expect(configKey(HostLoyaltyKitConfig, "loyalty_kit")).toBe("loyalty_kit");
  });

  it("refuses a class that is not a configuration", () => {
    expect(() => configKey(Options, "x")).toThrow(TypeError);
  });
});
