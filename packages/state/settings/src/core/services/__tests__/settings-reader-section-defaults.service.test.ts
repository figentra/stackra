/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsReader#get` over a schema shaped as gen emits a settings section (`.prefault(() =>
 *          ({}))`, STA-1826): no stored row reads every default, a partial stored section keeps its stored values and
 *          takes the defaults of the rest, and a wrong-typed stored value still throws.
 * Boundary: test only; the store is the memory driver and the schema is registered by hand, as gen's schemas file
 *           registers it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0307 (rules 22 to 24); STA-1826.
 */
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { Settings } from "#core/bases/settings.base";
import { MemorySettingValueStoreDriver } from "#core/drivers/memory-setting-value-store.driver";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { SettingsReader } from "#core/services/settings-reader.service";

class GatewaySettings extends Settings({ scopes: [SettingScope.Platform] }) {
  escalationHours = 24;

  routing!: { strictInRegion: boolean; maxClass: string };
}

const RoutingSettings$ = z.object({
  strictInRegion: z.boolean().default(false),
  maxClass: z.string().default("deep"),
});

registerSchemas([
  [
    GatewaySettings,
    z.object({
      escalationHours: z.number().int().default(24),
      routing: RoutingSettings$.prefault(() => ({})),
    }),
  ],
]);

const DEFAULTS = { escalationHours: 24, routing: { strictInRegion: false, maxClass: "deep" } };

describe("SettingsReader section defaults", () => {
  it("reads every default, section fields included, when no row is stored", async () => {
    const gateway = await new SettingsReader(new MemorySettingValueStoreDriver()).get(
      GatewaySettings,
    );
    expect({ ...gateway }).toEqual(DEFAULTS);
  });

  it("keeps a partial stored section's values and defaults the rest", async () => {
    const store = new MemorySettingValueStoreDriver().seed("gateway", {
      "routing.strictInRegion": true,
    });
    const gateway = await new SettingsReader(store).get(GatewaySettings);
    expect({ ...gateway }).toEqual({
      ...DEFAULTS,
      routing: { strictInRegion: true, maxClass: "deep" },
    });
  });

  it("still throws on a wrong-typed stored value in a section", async () => {
    const store = new MemorySettingValueStoreDriver().seed("gateway", {
      "routing.strictInRegion": "yes",
    });
    await expect(new SettingsReader(store).get(GatewaySettings)).rejects.toThrow();
  });
});
