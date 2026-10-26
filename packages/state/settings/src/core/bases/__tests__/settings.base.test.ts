/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Settings` kind base: the template's groups record their scopes and navigation,
 *          an empty or repeated scope list is refused at declaration, the kind is called only, a section and the
 *          validation decorators fit its fields, `Fields<X>` is exactly the declared fields, the default `rules(r)`
 *          declares none, and `SettingsRules` accepts number paths only.
 * Boundary: test only; the classes restate the template's `orders.settings.ts` and `loyalty-kit.settings.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rule 22); ADR 0294 (decisions 16, 25 and 26).
 */
import { kindOf } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import type { IconName } from "@stackra/icons/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Int, Schema } from "@stackra/validation";
import type { Fields } from "@stackra/validation";

import { Settings } from "#core/bases/settings.base";
import { SettingScope } from "#core/enums/setting-scope.enum";
import type { SettingsClass } from "#core/types/settings-class.type";
import type { SettingsRule } from "#core/types/settings-rule.type";
import type { SettingsRules } from "#core/types/settings-rules.type";

const SALES = "orders::nav.sales" as I18nKey;
const RECEIPT: IconName = "receipt";

class LoyaltyTierSettings extends Schema {
  @Int({ min: 0 })
  silverFrom = 1_000;

  @Int({ min: 0 })
  goldFrom = 5_000;
}

class LoyaltyKitSettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Product],
}) {
  @Int({
    min: 1,
    max: 60,
  })
  expiryMonths = 12;

  tiers!: LoyaltyTierSettings;

  override rules(r: SettingsRules<LoyaltyKitSettings>) {
    return [r.lessThan("tiers.silverFrom", "tiers.goldFrom")];
  }
}

class OrdersSettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Product],
  navigation: { group: SALES, icon: RECEIPT, order: 20 },
}) {
  @Int({ min: 0 })
  dailyRevenueTargetMinor: number | null = null;

  acceptingOrders = true;
}

describe("Settings", () => {
  it("records the scopes and the navigation, or null without one", () => {
    expect(kindOf(OrdersSettings)).toEqual({
      kind: "settings",
      options: {
        scopes: ["platform", "product"],
        navigation: { group: SALES, icon: RECEIPT, order: 20 },
      },
    });
    expect(kindOf(LoyaltyKitSettings)?.options).toEqual({
      scopes: ["platform", "product"],
      navigation: null,
    });
    expect(Object.isFrozen(kindOf(OrdersSettings)?.options["scopes"])).toBe(true);
  });

  it("keeps instanceof, the initializers and a class per call", () => {
    const orders = new OrdersSettings();
    expect(orders).toBeInstanceOf(Settings);
    expect(orders.acceptingOrders).toBe(true);
    expect(orders.dailyRevenueTargetMinor).toBeNull();
    expect(Object.getPrototypeOf(OrdersSettings)).not.toBe(
      Object.getPrototypeOf(LoyaltyKitSettings),
    );
    expect((Settings as unknown as { name: string }).name).toBe("Settings");
  });

  it("refuses an empty or repeated scope list", () => {
    expect(() => Settings({ scopes: [] })).toThrow(/at least one level/);
    expect(() => Settings({ scopes: ["platform", "platform"] })).toThrow(RangeError);
    expect(() => Settings({ scopes: [""] })).toThrow(RangeError);
  });

  it("declares no rule by default and returns the overridden ones", () => {
    class EmptySettings extends Settings({ scopes: [SettingScope.User] }) {}
    expect(new EmptySettings().rules({} as SettingsRules<EmptySettings>)).toEqual([]);
    const rule: SettingsRule = { kind: "less_than", a: "tiers.silverFrom", b: "tiers.goldFrom" };
    const r = { lessThan: () => rule } as unknown as SettingsRules<LoyaltyKitSettings>;
    expect(new LoyaltyKitSettings().rules(r)).toEqual([rule]);
  });

  it("is called only, and its fields are exactly the declared ones", () => {
    expectTypeOf(Settings({ scopes: ["platform"] })).toEqualTypeOf<SettingsClass>();
    expectTypeOf<keyof Fields<OrdersSettings>>().toEqualTypeOf<
      "acceptingOrders" | "dailyRevenueTargetMinor"
    >();
    expectTypeOf<Fields<LoyaltyKitSettings>["tiers"]>().toEqualTypeOf<
      Fields<LoyaltyTierSettings>
    >();
    // @ts-expect-error -- `scopes` is required
    expect(() => Settings({})).toThrow(TypeError);
  });

  it("types the rule paths to number fields, one level deep", () => {
    type Paths = Parameters<SettingsRules<OrdersSettings>["atMost"]>[0];
    expectTypeOf<Paths>().toEqualTypeOf<"dailyRevenueTargetMinor">();
    type TierPaths = Parameters<SettingsRules<LoyaltyKitSettings>["lessThan"]>[0];
    expectTypeOf<TierPaths>().toEqualTypeOf<
      "expiryMonths" | "tiers.silverFrom" | "tiers.goldFrom"
    >();
  });
});
