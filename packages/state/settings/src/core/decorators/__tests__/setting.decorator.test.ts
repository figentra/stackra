/**
 * Stackra file contract:
 * Purpose: unit tests of `@Setting`: it records its options on a settings field and on a section's field, reads them
 *          back through `Setting.members`, refuses an empty scope list and, on a settings class, a scope outside the
 *          class's, refuses a class of another kind, and `@Secret` cannot mark a settings field (a setting is never a
 *          secret).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 and 23); ADR 0294 (decision 6); ADR 0420.
 */
import { Secret } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { Int, Schema } from "@stackra/validation";

import { Settings } from "#core/bases/settings.base";
import { Setting } from "#core/decorators/setting.decorator";
import { SettingScope } from "#core/enums/setting-scope.enum";

class OrderCancellationSettings extends Schema {
  @Int({ min: 5, max: 1440 })
  @Setting({ scopes: [SettingScope.Platform] })
  maxAutoCancelAfterMinutes = 60;

  @Setting({ lockable: true, client: true })
  customersMayCancel = true;
}

class OrdersSettings extends Settings({ scopes: [SettingScope.Platform, SettingScope.Product] }) {
  @Setting({ client: true })
  acceptingOrders = true;

  @Int({ min: 0 })
  @Setting({ scopes: [SettingScope.Product], approval: true })
  dailyRevenueTargetMinor: number | null = null;

  @Setting({ approval: true })
  cancellation!: OrderCancellationSettings;
}

describe("Setting", () => {
  it("records the options of each decorated settings field", () => {
    expect(Object.fromEntries(Setting.members(OrdersSettings))).toEqual({
      acceptingOrders: { client: true },
      dailyRevenueTargetMinor: { scopes: ["product"], approval: true },
      cancellation: { approval: true },
    });
  });

  it("records the options of a section's fields", () => {
    expect(Setting.members(OrderCancellationSettings).get("customersMayCancel")).toEqual({
      lockable: true,
      client: true,
    });
    expect(
      Object.isFrozen(Setting.members(OrderCancellationSettings).get("maxAutoCancelAfterMinutes")),
    ).toBe(true);
  });

  it("refuses an empty scope list", () => {
    expect(() => Setting({ scopes: [] })).toThrow(/at least one level/);
  });

  it("records an entitlement gate and refuses a blank or empty one", () => {
    class AccessSettings extends Settings({ scopes: [SettingScope.Platform] }) {
      @Setting({ entitlement: "access.sso" })
      ssoEnforced = false;

      @Setting({ entitlementValues: { unlimited: "access.enterprise_support" } })
      supportLength = "hour";
    }
    expect(Object.fromEntries(Setting.members(AccessSettings))).toEqual({
      ssoEnforced: { entitlement: "access.sso" },
      supportLength: { entitlementValues: { unlimited: "access.enterprise_support" } },
    });
    expect(() => Setting({ entitlement: " " })).toThrow(RangeError);
    expect(() => Setting({ entitlementValues: {} })).toThrow(RangeError);
    expect(() => Setting({ entitlementValues: { unlimited: "" } })).toThrow(RangeError);
  });

  it("refuses a scope outside its settings class's", () => {
    expect(() => {
      class MessagesSettings extends Settings({ scopes: [SettingScope.User] }) {
        @Setting({ scopes: [SettingScope.Platform] })
        marketing = false;
      }
      return MessagesSettings;
    }).toThrow(/outside the class's scopes/);
  });

  it("refuses a class of another kind", () => {
    expect(() => {
      class Plain {
        @Setting({ client: true })
        value = true;
      }
      return Plain;
    }).toThrow(TypeError);
  });

  it("leaves no way to mark a settings field as a secret", () => {
    expect(() => {
      class LeakySettings extends Settings({ scopes: [SettingScope.Platform] }) {
        @Secret("STRIPE_SECRET_KEY")
        apiKey = "";
      }
      return LeakySettings;
    }).toThrow(TypeError);
  });
});
