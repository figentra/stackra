/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaConfig`: key `media`, the defaults, a runway layer that picks the S3 disk and the HTTP
 *          uploader, a refused driver name, and a host override.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";

describe("MediaConfig", () => {
  it("is keyed media", () => {
    expect(configKey(MediaConfig, "media")).toBe("media");
  });

  it("defaults to the memory drivers and a one-hour upload", () => {
    const config = buildConfig(MediaConfig);
    expect(config.disk).toBe("memory");
    expect(config.uploader).toBe("memory");
    expect(config.uploadExpiresIn).toBe(Duration.hours(1));
    expect(config.uploadEndpoint).toBe("/api/uploads");
  });

  it("takes a runway layer", () => {
    const config = buildConfig(MediaConfig, { values: { disk: "s3", uploader: "http" } });
    expect([config.disk, config.uploader]).toEqual(["s3", "http"]);
  });

  it("refuses a driver this package does not ship", () => {
    expect(() => buildConfig(MediaConfig, { values: { disk: "local" as never } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("takes a host override", () => {
    class HostMediaConfig extends MediaConfig {
      override uploadExpiresIn = Duration.minutes(15);
    }
    expect(buildConfig(HostMediaConfig).uploadExpiresIn).toBe(Duration.minutes(15));
  });
});
