/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsReader`: `get` returns an instance with the defaults and section defaults when
 *          nothing is stored, applies the cascade and locks root first and the user's values last, and throws on a
 *          stored value the schema refuses; `read` gives a page's values by name with its defaults and locks; `write`
 *          maps names to group paths, refuses an unknown key or a bad value without writing, and passes a lock
 *          refusal on.
 * Boundary: test only; the store is the memory driver and the schema is registered by hand, as gen's schemas file
 *           registers it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 to 24); ADR 0213 (decision 2).
 */
import type { ScopeRef } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { Setting } from "#core/decorators/setting.decorator";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingType } from "#core/enums/setting-type.enum";
import { SettingValueInvalidError } from "#core/errors/setting-value-invalid.error";
import { SettingsLockedError } from "#core/errors/settings-locked.error";
import { settingKeys } from "#core/functions/setting-keys.function";
import { settingsPage } from "#core/functions/settings-page.function";
import { SettingsReader } from "#core/services/settings-reader.service";

class OrderCancellationSettings extends Schema {
  @Int({ min: 5, max: 1440 })
  autoCancelAfterMinutes = 30;

  @Setting({ lockable: true })
  customersMayCancel = true;
}

class OrdersSettings extends Settings({ scopes: [SettingScope.Platform, SettingScope.Product] }) {
  acceptingOrders = true;

  @Int({ min: 0 })
  dailyRevenueTargetMinor: number | null = null;

  cancellation!: OrderCancellationSettings;
}

const OrderCancellationSettings$ = z.object({
  autoCancelAfterMinutes: z.number().int().min(5).max(1440).default(30),
  customersMayCancel: z.boolean().default(true),
});

registerSchemas([
  [
    OrdersSettings,
    z.object({
      acceptingOrders: z.boolean().default(true),
      dailyRevenueTargetMinor: z.number().int().min(0).nullable().default(null),
      cancellation: OrderCancellationSettings$.default(() => OrderCancellationSettings$.parse({})),
    }),
  ],
]);

const label = (key: string) => `orders::settings.${key}.label` as I18nKey;
const CASCADE = [SettingScope.Platform, SettingScope.Product];

const Keys = settingKeys({
  orders: {
    acceptingOrders: {
      type: SettingType.Boolean,
      default: true,
      scopes: CASCADE,
      label: label("accepting_orders"),
    },
    customersMayCancel: {
      type: SettingType.Boolean,
      default: true,
      lockable: true,
      section: "cancellation",
      scopes: CASCADE,
      label: label("cancellation.customers_may_cancel"),
    },
    autoCancelAfterMinutes: {
      type: SettingType.Integer,
      default: 30,
      min: 5,
      max: 1440,
      section: "cancellation",
      scopes: CASCADE,
      label: label("cancellation.auto_cancel_after_minutes"),
    },
  },
});
const PAGE = settingsPage("orders", { scope: SettingScope.Product });

const PLATFORM: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w0" as const;

describe(SettingsReader, () => {
  it("returns an instance with the defaults and the section defaults when nothing is stored", async () => {
    const orders = await new SettingsReader(new MemorySettingValueStoreDriver()).get(
      OrdersSettings,
    );
    expect(orders).toBeInstanceOf(OrdersSettings);
    expect({ ...orders }).toEqual({
      acceptingOrders: true,
      dailyRevenueTargetMinor: null,
      cancellation: { autoCancelAfterMinutes: 30, customersMayCancel: true },
    });
  });

  it("resolves root first, keeps a lock and nests sections", async () => {
    const store = new MemorySettingValueStoreDriver().seed("orders", { acceptingOrders: false });
    await store.write("orders", { scope: PLATFORM }, { "cancellation.customersMayCancel": false }, [
      "cancellation.customersMayCancel",
    ]);
    await store.write("orders", { scope: ACME }, { "cancellation.autoCancelAfterMinutes": 45 });
    const orders = await new SettingsReader(store).get(OrdersSettings, { scope: ACME });
    expect(orders.acceptingOrders).toBe(false);
    expect(orders.cancellation).toEqual({ autoCancelAfterMinutes: 45, customersMayCancel: false });
  });

  it("applies the user's values last", async () => {
    const store = new MemorySettingValueStoreDriver().seed("orders", { acceptingOrders: true });
    await store.write("orders", { user: USER }, { acceptingOrders: false });
    const reader = new SettingsReader(store);
    expect((await reader.get(OrdersSettings, { user: USER })).acceptingOrders).toBe(false);
    expect((await reader.get(OrdersSettings)).acceptingOrders).toBe(true);
  });

  it("throws on a stored value the schema refuses", async () => {
    const store = new MemorySettingValueStoreDriver().seed("orders", {
      dailyRevenueTargetMinor: -1,
    });
    await expect(new SettingsReader(store).get(OrdersSettings)).rejects.toThrow();
  });

  it("reads a page's values by name with its defaults and locks", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: PLATFORM }, { "cancellation.customersMayCancel": false }, [
      "cancellation.customersMayCancel",
    ]);
    await expect(new SettingsReader(store).read(PAGE, { scope: ACME })).resolves.toEqual({
      values: { acceptingOrders: true, customersMayCancel: false, autoCancelAfterMinutes: 30 },
      locked: ["customersMayCancel"],
    });
  });

  it("writes names as group paths at the target", async () => {
    const store = new MemorySettingValueStoreDriver();
    await new SettingsReader(store).write(
      PAGE,
      { acceptingOrders: false, autoCancelAfterMinutes: 60 },
      { scope: ACME },
    );
    await expect(store.layers("orders", { scope: ACME })).resolves.toEqual([
      { values: { acceptingOrders: false, "cancellation.autoCancelAfterMinutes": 60 }, locked: [] },
    ]);
    expect(Keys.orders.autoCancelAfterMinutes.path).toBe(
      "orders.cancellation.autoCancelAfterMinutes",
    );
  });

  it("refuses an unknown key or a bad value and writes nothing", async () => {
    const store = new MemorySettingValueStoreDriver();
    const refused = await new SettingsReader(store)
      .write(PAGE, { acceptingOrders: true, autoCancelAfterMinutes: 2, unknown: 1 })
      .catch((error: unknown) => error);
    expect(isRefusal(refused, SettingValueInvalidError)).toBe(true);
    expect((refused as SettingValueInvalidError).keys).toEqual([
      "orders.cancellation.autoCancelAfterMinutes",
      "orders.unknown",
    ]);
    expect((refused as SettingValueInvalidError).fieldErrors).toEqual({
      "orders.cancellation.autoCancelAfterMinutes": "setting_value_invalid",
      "orders.unknown": "setting_value_invalid",
    });
    await expect(store.layers("orders", {})).resolves.toEqual([]);
  });

  it("passes the store's lock refusal on", async () => {
    const store = new MemorySettingValueStoreDriver();
    await store.write("orders", { scope: PLATFORM }, { "cancellation.customersMayCancel": false }, [
      "cancellation.customersMayCancel",
    ]);
    await expect(
      new SettingsReader(store).write(PAGE, { customersMayCancel: true }, { scope: ACME }),
    ).rejects.toBeInstanceOf(SettingsLockedError);
  });
});
