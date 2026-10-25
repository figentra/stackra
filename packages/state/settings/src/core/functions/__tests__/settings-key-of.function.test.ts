/**
 * Stackra file contract:
 * Purpose: unit tests of `settingsKeyOf`: the module key in snake_case from the class name, the base's key for a host
 *          override, and a class that is not a settings class refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 20); ADR 0305 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { Settings } from "#core/bases/settings.base";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { settingsKeyOf } from "#core/functions/settings-key-of.function";

class OrdersSettings extends Settings({ scopes: [SettingScope.Platform] }) {
  acceptingOrders = true;
}

class LoyaltyKitSettings extends Settings({ scopes: [SettingScope.Platform] }) {
  expiryMonths = 12;
}

describe("settingsKeyOf", () => {
  it("derives the module key from the class name", () => {
    expect(settingsKeyOf(OrdersSettings)).toBe("orders");
    expect(settingsKeyOf(LoyaltyKitSettings)).toBe("loyalty_kit");
  });

  it("keeps the base's key for a host override", () => {
    const BaseOrdersSettings = OrdersSettings;
    // A host override keeps the name; a differently named subclass still reads its base's key.
    class TestOrdersOverride extends BaseOrdersSettings {
      override acceptingOrders = false;
    }
    expect(settingsKeyOf(TestOrdersOverride)).toBe("orders");
  });

  it("refuses a class that is not a settings class", () => {
    expect(() => settingsKeyOf(class Plain {})).toThrow(TypeError);
    expect(() => settingsKeyOf(Settings as never)).toThrow(TypeError);
  });
});
