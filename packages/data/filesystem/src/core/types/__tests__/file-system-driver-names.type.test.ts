/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entry: `DriverName<FileSystem>` is exactly this package's driver names,
 *          which equal the shipped schema's `disk` enum.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 4).
 */
import "#core/types/file-system-driver-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { FileSystem } from "#contracts/ports/file-system.port";
import { FILE_SYSTEM_DISKS } from "#core/constants/file-system-disks.constant";
import { FILESYSTEM_CONFIG_SCHEMA } from "#core/constants/filesystem-config-schema.constant";

describe("DriverRegistry['filesystem.FileSystem']", () => {
  it("narrows DriverName<FileSystem> to the shipped drivers", () => {
    expectTypeOf<DriverName<FileSystem>>().toEqualTypeOf<
      "memory" | "local" | "s3" | "gcs" | "encore_bucket" | "electron"
    >();
    expectTypeOf<DriverRegistry["filesystem.FileSystem"]>().toEqualTypeOf<DriverName<FileSystem>>();
  });

  it("matches the schema's disk enum", () => {
    expect(FILESYSTEM_CONFIG_SCHEMA.shape.disk.unwrap().options).toEqual([...FILE_SYSTEM_DISKS]);
  });
});
