/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsFake`: seeded values (a section's fields included) resolve through the real cascade
 *          and schema with every other field at its default, and each page write is recorded as `{ page, scope,
 *          values }` and stored, even when the reader then refuses it.
 * Boundary: test only; the schema is registered by hand, as gen's schemas file registers it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0307 (rules 22 and 24).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { Settings, SettingScope, SettingType, settingKeys, settingsPage } from "#core/index";
import { SettingsFake } from "#testing/settings.fake";

class OrderCancellationSettings extends Schema {
  autoCancelAfterMinutes = 30;

  customersMayCancel = true;
}

class OrdersSettings extends Settings({ scopes: [SettingScope.Platform, SettingScope.Product] }) {
  acceptingOrders = true;

  cancellation!: OrderCancellationSettings;
}

const Cancellation$ = z.object({
  autoCancelAfterMinutes: z.number().int().default(30),
  customersMayCancel: z.boolean().default(true),
});

registerSchemas([
  [
    OrdersSettings,
    z.object({
      acceptingOrders: z.boolean().default(true),
      cancellation: Cancellation$.default(() => Cancellation$.parse({})),
    }),
  ],
]);

settingKeys({
  orders: {
    acceptingOrders: {
      type: SettingType.Boolean,
      default: true,
      scopes: [SettingScope.Platform],
      label: "orders::settings.accepting_orders.label" as I18nKey,
    },
  },
});
const PAGE = settingsPage("orders", { scope: SettingScope.Platform });

describe(SettingsFake, () => {
  it("resolves seeded values through the real schema, defaults elsewhere", async () => {
    const fake = new SettingsFake([
      [OrdersSettings, { cancellation: { customersMayCancel: false } }],
    ]);
    const orders = await fake.get(OrdersSettings);
    expect(orders).toBeInstanceOf(OrdersSettings);
    expect({ ...orders }).toEqual({
      acceptingOrders: true,
      cancellation: { autoCancelAfterMinutes: 30, customersMayCancel: false },
    });
  });

  it("records each page write and stores it", async () => {
    const fake = new SettingsFake();
    await fake.write(PAGE, { acceptingOrders: false });
    expect(fake.writes).toEqual([
      { page: PAGE, scope: SettingScope.Platform, values: { acceptingOrders: false } },
    ]);
    expect((await fake.get(OrdersSettings)).acceptingOrders).toBe(false);
  });

  it("records a write the reader refuses", async () => {
    const fake = new SettingsFake();
    await expect(fake.write(PAGE, { acceptingOrders: "yes" })).rejects.toThrow();
    expect(fake.writes).toHaveLength(1);
  });
});
