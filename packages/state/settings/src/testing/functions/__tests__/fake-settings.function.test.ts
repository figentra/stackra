/**
 * Stackra file contract:
 * Purpose: unit and type tests of `fakeSettings`: with no entry a fake over defaults; with entries each class reads its
 *          patch; a patch is typed by its class, so an unknown or mistyped field fails the type check.
 * Boundary: test only; the schemas are registered by hand, as gen's schemas files register them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0263 (`.override(Port, fake)`).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Settings, SettingScope } from "#core/index";
import { fakeSettings } from "#testing/functions/fake-settings.function";
import { SettingsFake } from "#testing/settings.fake";

class InventorySettings extends Settings({
  scopes: [SettingScope.Platform, SettingScope.Product],
}) {
  lowStockThreshold = 5;

  allowBackorders = false;
}

class MessagesSettings extends Settings({ scopes: [SettingScope.User] }) {
  marketing = false;
}

registerSchemas([
  [
    InventorySettings,
    z.object({
      lowStockThreshold: z.number().int().min(0).default(5),
      allowBackorders: z.boolean().default(false),
    }),
  ],
  [MessagesSettings, z.object({ marketing: z.boolean().default(false) })],
]);

describe("fakeSettings", () => {
  it("fakes the defaults with no entry", async () => {
    const fake = fakeSettings();
    expect(fake).toBeInstanceOf(SettingsFake);
    expect(fake.writes).toEqual([]);
    expect((await fake.get(InventorySettings)).lowStockThreshold).toBe(5);
  });

  it("gives each class its patch", async () => {
    const fake = fakeSettings([
      [InventorySettings, { lowStockThreshold: 2 }],
      [MessagesSettings, { marketing: true }],
    ]);
    expect({ ...(await fake.get(InventorySettings)) }).toEqual({
      lowStockThreshold: 2,
      allowBackorders: false,
    });
    expect((await fake.get(MessagesSettings)).marketing).toBe(true);
  });

  it("types each patch by its class", () => {
    expectTypeOf(fakeSettings).returns.toEqualTypeOf<SettingsFake>();
    // @ts-expect-error -- `marketing` is not a field of InventorySettings
    fakeSettings([[InventorySettings, { marketing: true }]]);
    // @ts-expect-error -- `lowStockThreshold` is a number
    fakeSettings([[InventorySettings, { lowStockThreshold: "2" }]]);
  });
});
