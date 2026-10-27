/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaConfig`: key `media`, the defaults, a runway layer that picks the HTTP uploader and the
 *          clamav scanner (no `disk`: ADR 0465), a refused driver name, a host override, and the C2PA certificate read blind from the secret store.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended.
 */
import {
  buildConfig,
  ConfigInvalidError,
  configKey,
  MemorySecretStoreDriver,
} from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";

describe("MediaConfig", () => {
  it("is keyed media", () => {
    expect(configKey(MediaConfig, "media")).toBe("media");
  });

  it("defaults to the memory drivers and a one-hour upload", () => {
    const config = buildConfig(MediaConfig);
    expect(config.uploader).toBe("memory");
    expect(config.uploadExpiresIn).toBe(Duration.hours(1));
    expect(config.uploadEndpoint).toBe("/api/uploads");
  });

  it("takes a runway layer", () => {
    const config = buildConfig(MediaConfig, { values: { uploader: "http", scanner: "clamav" } });
    expect([config.uploader, config.scanner]).toEqual(["http", "clamav"]);
  });

  it("refuses a driver this package does not ship", () => {
    expect(() => buildConfig(MediaConfig, { values: { uploader: "s3" as never } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("takes a host override", () => {
    class HostMediaConfig extends MediaConfig {
      override uploadExpiresIn = Duration.minutes(15);
    }
    expect(buildConfig(HostMediaConfig).uploadExpiresIn).toBe(Duration.minutes(15));
  });

  it("leaves the C2PA certificate empty until the secret is set", () => {
    expect(buildConfig(MediaConfig).c2paSigningCertificate).toBe("");
    const config = buildConfig(MediaConfig, {
      secrets: new MemorySecretStoreDriver()
        .set("MEDIA_C2PA_SIGNING_CERTIFICATE", "CERT")
        .set("MEDIA_C2PA_SIGNING_KEY", "KEY"),
    });
    expect([config.c2paSigningCertificate, config.c2paSigningKey]).toEqual(["CERT", "KEY"]);
  });
});
