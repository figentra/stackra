/**
 * Stackra file contract:
 * Purpose: unit tests of the `config` `FlagProvider` driver: a driver of the port that answers every subject, the
 *          anonymous one included, with the configured values.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { FeatureFlagsConfig } from "#config/feature-flags.config";
import { FlagProvider } from "#contracts/ports/flag-provider.port";
import { ConfigFlagProviderDriver } from "#core/drivers/config-flag-provider.driver";

const config = buildConfig(FeatureFlagsConfig, { values: { values: { "web.help_centre": true } } });

describe("ConfigFlagProviderDriver", () => {
  it("is a driver of FlagProvider", () => {
    expect(new ConfigFlagProviderDriver(config)).toBeInstanceOf(FlagProvider);
    expect(kindOf(ConfigFlagProviderDriver)).toEqual({
      kind: "driver",
      options: { port: FlagProvider },
    });
  });

  it("answers every subject with the configured values", async () => {
    const driver = new ConfigFlagProviderDriver(config);
    await expect(driver.values()).resolves.toEqual({ "web.help_centre": true });
    await expect((driver as FlagProvider).values({ subject: null, scope: null })).resolves.toEqual({
      "web.help_centre": true,
    });
  });
});
