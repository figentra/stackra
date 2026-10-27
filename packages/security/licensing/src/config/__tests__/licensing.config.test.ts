/**
 * Stackra file contract:
 * Purpose: unit tests of `LicensingConfig`: the defaults (Keygen's hosted origin, no account, no key), the derived key
 *          `licensing`, a host override with its account and verify key, and a boot refusal for an origin that is not
 *          an absolute `https:` origin or a key that is not 64 hex characters.
 * Boundary: test only; builds through @stackra/config's `buildConfig`, as `createApp` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decisions 19 and 20); owner round 3 #37.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { LicensingConfig } from "#config/licensing.config";

/** A host with its account and a self-hosted licence server. */
class HostLicensingConfig extends LicensingConfig {
  override apiUrl = "https://licences.acme.example";

  override account = "acme";

  override publicKey = "e8601e48b69383ba520245fd07971e983d06d22c4257cfd82304601479cee788";
}

describe("LicensingConfig", () => {
  it("defaults to the hosted origin with no account or key", () => {
    expect({ ...buildConfig(LicensingConfig) }).toEqual({
      apiUrl: "https://api.keygen.sh",
      account: "",
      publicKey: "",
    });
  });

  it("derives the key licensing", () => {
    expect(configKey(LicensingConfig, "licensing")).toBe("licensing");
    expect(configKey(HostLicensingConfig, "licensing")).toBe("licensing");
  });

  it("builds a host override", () => {
    const config = buildConfig(HostLicensingConfig);
    expect(config.apiUrl).toBe("https://licences.acme.example");
    expect(config.account).toBe("acme");
  });

  it.each([
    [{ apiUrl: "http://licences.acme.example" }],
    [{ apiUrl: "https://licences.acme.example/v1" }],
    [{ publicKey: "abc" }],
  ])("refuses %j at boot", (values) => {
    expect(() => buildConfig(LicensingConfig, { values })).toThrow(ConfigInvalidError);
  });
});
