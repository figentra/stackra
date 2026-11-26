/**
 * Stackra file contract:
 * Purpose: unit tests of gen's `settingsKeyOf`: the runtime's cases (`OrdersSettings` is `orders`,
 *          `LoyaltyKitSettings` is `loyalty_kit`, `AccountSettings` is `account`), an empty stem, and a host override
 *          keyed by its base's name.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); ADR 0305 (rule 1); STA-2056.
 */
import { describe, expect, it } from "@stackra/testing";

import { settingsKeyOf } from "#core/functions/settings-key-of.function";

describe("settingsKeyOf", () => {
  it("drops the trailing Settings and snake-cases the stem, as the runtime does", () => {
    expect(settingsKeyOf("OrdersSettings")).toBe("orders");
    expect(settingsKeyOf("LoyaltyKitSettings")).toBe("loyalty_kit");
    expect(settingsKeyOf("AccountSettings")).toBe("account");
    expect(settingsKeyOf("OrdersPolicySettings")).toBe("orders_policy");
    expect(settingsKeyOf("Oauth2ClientSettings")).toBe("oauth2_client");
  });

  it("is empty for a class named only Settings, for the caller to refuse", () => {
    expect(settingsKeyOf("Settings")).toBe("");
  });

  it("keys a host override by its base's name", () => {
    expect(
      settingsKeyOf({
        name: "AppSettings",
        base: { kind: "package", name: "AccountSettings", from: "@stackra/settings" },
      }),
    ).toBe("account");
    expect(settingsKeyOf({ name: "OrdersSettings" })).toBe("orders");
  });
});
