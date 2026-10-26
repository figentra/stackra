/**
 * Stackra file contract:
 * Purpose: unit tests of `KioskConfig`: keyed `platform.kiosk`, built with its defaults (no lock on launch, a 90-second
 *          idle reset, standing reach, contrast and audio off), overridden by a host, and refusing a bad reach.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0428 (decisions 1 and 2); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { KioskConfig as BaseKioskConfig } from "#config/kiosk.config";

/** A host's override: a seated kiosk that locks on launch. */
class KioskConfig extends BaseKioskConfig {
  override enterOnLaunch = true;
  override reach: BaseKioskConfig["reach"] = "seated";
}

describe("KioskConfig", () => {
  it("is keyed platform.kiosk", () => {
    expect(configKey(BaseKioskConfig, "platform")).toBe("platform.kiosk");
  });

  it("builds with its defaults", () => {
    const config = buildConfig(BaseKioskConfig);
    expect(config.enterOnLaunch).toBe(false);
    expect(Duration.toMilliseconds(config.idleTimeout)).toBe(90_000);
    expect(config.reach).toBe("standing");
    expect(config.isHighContrast).toBe(false);
    expect(config.isAudioOn).toBe(false);
  });

  it("takes a host's override", () => {
    const config = buildConfig(KioskConfig);
    expect(config.enterOnLaunch).toBe(true);
    expect(config.reach).toBe("seated");
  });

  it("refuses a reach it does not know", () => {
    class BadKioskConfig extends BaseKioskConfig {
      override reach = "kneeling" as BaseKioskConfig["reach"];
    }
    expect(() => buildConfig(BadKioskConfig)).toThrow(ConfigInvalidError);
  });
});
