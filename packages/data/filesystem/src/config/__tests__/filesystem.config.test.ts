/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FilesystemConfig`: a configuration over `FilesystemOptions` keyed `filesystem`
 *          (the key runway's `config.filesystem.disk` sets), built with its defaults, the template's runway values
 *          and a host override.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19 and
 *                     20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { FilesystemConfig } from "#config/filesystem.config";
import type { FileSystem } from "#contracts/ports/file-system.port";
import { FILESYSTEM_CONFIG_SCHEMA } from "#core/constants/filesystem-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BaseFilesystemConfig = FilesystemConfig;

/** A base instance whose nested values an override spreads (tsc refuses `this.<field>` in its own initializer). */
const BASE = new BaseFilesystemConfig();

class HostFilesystemConfig extends BaseFilesystemConfig {
  override disk: DriverName<FileSystem> = "s3";

  override s3: FilesystemConfig["s3"] = { ...BASE.s3, bucket: "acme-files", region: "auto" };
}

describe("FilesystemConfig", () => {
  it("is a configuration keyed filesystem, an override inheriting the key", () => {
    expect(new FilesystemConfig()).toBeInstanceOf(Config);
    expect(configKey(FilesystemConfig, "filesystem")).toBe("filesystem");
    expect(configKey(HostFilesystemConfig, "filesystem")).toBe("filesystem");
  });

  it("types its fields on the class and builds with the defaults", () => {
    const config = buildConfig(FilesystemConfig);
    expectTypeOf(config.disk).toEqualTypeOf<DriverName<FileSystem>>();
    expectTypeOf(config.s3.bucket).toEqualTypeOf<string>();
    expect({ ...config }).toEqual(FILESYSTEM_CONFIG_SCHEMA.parse({}));
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("takes the template's runway values", () => {
    expect(buildConfig(FilesystemConfig, { values: { disk: "local" } }).disk).toBe("local");
    expect(buildConfig(FilesystemConfig, { values: { disk: "s3" } }).disk).toBe("s3");
  });

  it("applies a host override over the base value", () => {
    expect(buildConfig(HostFilesystemConfig)).toMatchObject({
      disk: "s3",
      s3: { bucket: "acme-files", region: "auto", endpoint: null, forcePathStyle: false },
    });
  });

  it("refuses a disk no driver answers to", () => {
    expect(() =>
      buildConfig(FilesystemConfig, { values: { disk: "ftp" as DriverName<FileSystem> } }),
    ).toThrow(ConfigInvalidError);
  });
});
