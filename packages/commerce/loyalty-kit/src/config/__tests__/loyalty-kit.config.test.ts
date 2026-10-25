/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitConfig`: a configuration keyed `loyalty_kit` that builds with the shipped
 *          defaults, reads the ledger from `STACKRA_LOYALTY_KIT_LEDGER`, takes a host override, and refuses an unknown
 *          driver or a cap above 100 %.
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
  override maxRedeemPercent = 30;
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
    expectTypeOf(config.maxRedeemPercent).toEqualTypeOf<number>();
    expect({ ...config }).toEqual(LOYALTY_KIT_CONFIG_SCHEMA.parse({}));
    expect(config.ledger).toBe("postgres");
    expect(config.pointValueMinor).toBe(1);
    expect(config.earnPerMinor).toBe(0.01);
    expect(config.maxRedeemPercent).toBe(50);
  });

  it("reads the ledger from the environment and takes a host override", () => {
    expect(
      buildConfig(LoyaltyKitConfig, { env: { STACKRA_LOYALTY_KIT_LEDGER: "memory" } }).ledger,
    ).toBe("memory");
    expect(buildConfig(HostLoyaltyKitConfig).maxRedeemPercent).toBe(30);
  });

  it("refuses a driver no one ships and a cap above 100 %", () => {
    expect(() =>
      buildConfig(LoyaltyKitConfig, {
        values: { ledger: "redis" as DriverName<LoyaltyLedger> },
      }),
    ).toThrow(ConfigInvalidError);
    expect(() => buildConfig(LoyaltyKitConfig, { values: { maxRedeemPercent: 101 } })).toThrow(
      ConfigInvalidError,
    );
  });
});
