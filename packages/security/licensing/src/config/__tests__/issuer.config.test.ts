/**
 * Stackra file contract:
 * Purpose: unit tests of `IssuerConfig`: the defaults (driver `keygen`, no token), the derived key `licensing.issuer`,
 *          a host override to the `memory` driver, and a boot refusal for an unknown driver.
 * Boundary: test only; builds through @stackra/config's `buildConfig`, as `createApp` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19 and 20); ADR 0178 (decision 2).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { IssuerConfig } from "#config/issuer.config";
import type { LicenceIssuer } from "#core/ports/licence-issuer.port";

/** A dev stack that keeps licences in the process. */
class DevIssuerConfig extends IssuerConfig {
  override driver: DriverName<LicenceIssuer> = "memory";
}

describe("IssuerConfig", () => {
  it("defaults to the keygen driver with no token", () => {
    const config = buildConfig(IssuerConfig);
    expect(config.driver).toBe("keygen");
    expect(config.productToken).toBe("");
  });

  it("derives the key licensing.issuer", () => {
    expect(configKey(IssuerConfig, "licensing")).toBe("licensing.issuer");
    expect(configKey(DevIssuerConfig, "licensing")).toBe("licensing.issuer");
  });

  it("builds a host override", () => {
    expect(buildConfig(DevIssuerConfig).driver).toBe("memory");
  });

  it("refuses an unknown driver at boot", () => {
    expect(() =>
      buildConfig(IssuerConfig, { values: { driver: "paper" as DriverName<LicenceIssuer> } }),
    ).toThrow(ConfigInvalidError);
  });
});
