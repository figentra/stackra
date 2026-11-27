/**
 * Stackra file contract:
 * Purpose: unit tests of `MediaConfig`: key `media`, the defaults, a runway layer that picks the HTTP uploader and the
 *          clamav scanner (no `disk`: ADR 0465), a refused driver name, a host override, and the C2PA certificate read blind from the secret store;
 *          the boot refusal of the `memory` scanner outside `dev` and `test` (STA-669), judged on the one environment
 *          reader's closed list, from the runtime only: a value (a runway `config` block, a test's values) cannot set
 *          the environment, and a misspelt one fails (STA-2844).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0222; ADR 0266
 *                     (decision 2); ADR 0296 (amendment 2026-11-26); STA-2844; STA-669.
 */
import {
  buildConfig,
  ConfigInvalidError,
  configKey,
  MemorySecretStoreDriver,
  StackraEnvironment,
} from "@stackra/config";
import { Duration, Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { MEDIA_CONFIG_SCHEMA } from "#core/constants/media-config-schema.constant";
import type { MediaOptions } from "#core/schemas/media-options.schema";

/** A production build whose values (a runway block, a test) claim `dev`. */
const buildDevValueInProduction = () =>
  buildConfig(MediaConfig, {
    env: { STACKRA_ENVIRONMENT: "production" },
    values: { environment: "dev" },
  });

/** The issues `build` fails with, or none. */
function issuesOf(build: () => unknown): readonly { path: string; message: string }[] {
  try {
    build();
  } catch (error) {
    return (error as ConfigInvalidError).issues;
  }
  return [];
}

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

  it("reads the running environment from STACKRA_ENVIRONMENT, dev when unset", () => {
    expect(buildConfig(MediaConfig).environment).toBe("dev");
    expect(buildConfig(MediaConfig, { env: { STACKRA_ENVIRONMENT: "test" } }).environment).toBe(
      "test",
    );
  });

  it.each(["preview", "staging", "production"])(
    "refuses the memory scanner at boot in %s, naming the field and the runway key",
    (environment) => {
      const build = () => buildConfig(MediaConfig, { env: { STACKRA_ENVIRONMENT: environment } });
      expect(build).toThrow(ConfigInvalidError);
      const issues = issuesOf(build);
      expect(issues.map(({ path }) => path)).toEqual(["scanner"]);
      expect(issues[0]?.message).toContain(`${environment} refuses it`);
      expect(issues[0]?.message).toContain("config.media.scanner");
    },
  );

  it.each([
    ["production", "guard_duty"],
    ["staging", "clamav"],
    ["preview", "clamav"],
  ] as const)("boots %s with the %s scanner", (environment, scanner) => {
    const config = buildConfig(MediaConfig, {
      env: { STACKRA_ENVIRONMENT: environment },
      values: { scanner },
    });
    expect([config.environment, config.scanner]).toEqual([environment, scanner]);
  });

  it.each(["dev", "test"])("keeps the memory scanner in %s", (environment) => {
    expect(buildConfig(MediaConfig, { env: { STACKRA_ENVIRONMENT: environment } }).scanner).toBe(
      "memory",
    );
  });

  it("refuses an unknown environment instead of running it as dev", () => {
    expect(() => buildConfig(MediaConfig, { env: { STACKRA_ENVIRONMENT: "prod" } })).toThrow(
      /environment: is not a Stackra environment.*\(STACKRA_ENVIRONMENT\)/,
    );
  });

  it("judges the environment on the one closed list of @stackra/config (STA-2844)", () => {
    expectTypeOf<MediaOptions["environment"]>().toEqualTypeOf<StackraEnvironment>();
    expect(MEDIA_CONFIG_SCHEMA.shape.environment.unwrap().options).toEqual(
      Enum.values(StackraEnvironment),
    );
  });

  it("never takes the environment from a value, so runway cannot make production read as dev (STA-2844)", () => {
    expect(buildDevValueInProduction).toThrow(ConfigInvalidError);
    expect(buildDevValueInProduction).toThrow(
      /environment: is safety-critical: it is read from STACKRA_ENVIRONMENT/,
    );
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
