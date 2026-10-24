/**
 * Stackra file contract:
 * Purpose: unit and type tests of `settingKeys`: each key carries its metadata, module, name and full path (with its
 *          section), the result is frozen, `pick` derives a schema class recording the keys' paths and typed from their
 *          types, and a module named `pick` is refused.
 * Boundary: test only; the tree restates the template console's generated `#stackra/settings`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 and 24); ADR 0294 (decision 25).
 */
import { kindOf } from "@stackra/container";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";
import type { Fields } from "@stackra/validation";

import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingType } from "#core/enums/setting-type.enum";
import { settingKeys } from "#core/functions/setting-keys.function";

const label = (key: string) => `orders::settings.${key}.label` as I18nKey;
const CASCADE = [SettingScope.Platform, SettingScope.Product];

const Settings = settingKeys({
  orders: {
    autoCancelAfterMinutes: {
      type: SettingType.Integer,
      default: 30,
      min: 5,
      max: 1440,
      section: "cancellation",
      scopes: CASCADE,
      label: label("cancellation.auto_cancel_after_minutes"),
    },
    acceptingOrders: {
      type: SettingType.Boolean,
      default: true,
      scopes: CASCADE,
      label: label("accepting_orders"),
    },
    dailyRevenueTargetMinor: {
      type: SettingType.Integer,
      default: null,
      nullable: true,
      scopes: [SettingScope.Product],
      label: label("daily_revenue_target_minor"),
    },
  },
});

describe("settingKeys", () => {
  it("derives each key's module, name and full path", () => {
    expect(Settings.orders.autoCancelAfterMinutes).toMatchObject({
      module: "orders",
      name: "autoCancelAfterMinutes",
      path: "orders.cancellation.autoCancelAfterMinutes",
      type: "integer",
      default: 30,
      min: 5,
      max: 1440,
    });
    expect(Settings.orders.acceptingOrders.path).toBe("orders.acceptingOrders");
    expect(Object.isFrozen(Settings)).toBe(true);
    expect(Object.isFrozen(Settings.orders.acceptingOrders)).toBe(true);
  });

  it("derives a schema class over picked keys", () => {
    class OrdersTab extends Settings.pick([
      Settings.orders.acceptingOrders,
      Settings.orders.dailyRevenueTargetMinor,
    ]) {}
    expect(new OrdersTab()).toBeInstanceOf(Schema);
    expect(kindOf(OrdersTab)).toEqual({
      kind: "schema",
      options: { settingKeys: ["orders.acceptingOrders", "orders.dailyRevenueTargetMinor"] },
    });
    expectTypeOf<Fields<OrdersTab>>().toEqualTypeOf<{
      acceptingOrders: boolean;
      dailyRevenueTargetMinor: number | null;
    }>();
  });

  it("refuses a module named pick", () => {
    expect(() => settingKeys({ pick: {} })).toThrow(RangeError);
  });

  it("types each key's name", () => {
    expectTypeOf(Settings.orders.acceptingOrders.name).toEqualTypeOf<"acceptingOrders">();
  });
});
