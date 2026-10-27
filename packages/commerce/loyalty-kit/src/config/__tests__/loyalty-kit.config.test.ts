/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitConfig`: a configuration keyed `loyalty_kit` that builds with the shipped
 *          defaults, reads the ledger from `STACKRA_LOYALTY_KIT_LEDGER`, takes a host override, refuses an unknown
 *          driver, and holds no rate or cap (those are settings, STA-1323).
 * Boundary: test only; pure configuration building, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0146 as amended; ADR 0294 (decision 19).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LoyaltyKitConfig } from "#config/loyalty-kit.config";
import type { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import { LOYALTY_KIT_CONFIG_SCHEMA } from "#core/constants/loyalty-kit-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseLoyaltyKitConfig = LoyaltyKitConfig;

class HostLoyaltyKitConfig extends BaseLoyaltyKitConfig {
  override ledger = "memory" as const;
}

describe("LoyaltyKitConfig", () => {
  it("is a configuration keyed loyalty_kit, an override inheriting the key", () => {
    expect(new LoyaltyKitConfig()).toBeInstanceOf(Config);
    expect(configKey(LoyaltyKitConfig, "loyalty_kit")).toBe("loyalty_kit");
    expect(configKey(HostLoyaltyKitConfig, "loyalty_kit")).toBe("loyalty_kit");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(LoyaltyKitConfig);
    expectTypeOf(config.ledger).toEqualTypeOf<DriverName<LoyaltyLedger>>();
    expect({ ...config }).toEqual(LOYALTY_KIT_CONFIG_SCHEMA.parse({}));
    expect(config.ledger).toBe("postgres");
    expect(config).not.toHaveProperty("earnPerMinor");
    expect(config).not.toHaveProperty("pointValueMinor");
    expect(config).not.toHaveProperty("maxRedeemPercent");
  });

  it("reads the ledger from the environment and takes a host override", () => {
    expect(
      buildConfig(LoyaltyKitConfig, { env: { STACKRA_LOYALTY_KIT_LEDGER: "memory" } }).ledger,
    ).toBe("memory");
    expect(buildConfig(HostLoyaltyKitConfig).ledger).toBe("memory");
  });

  it("refuses a driver no one ships", () => {
    expect(() =>
      buildConfig(LoyaltyKitConfig, {
        values: { ledger: "redis" as DriverName<LoyaltyLedger> },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
