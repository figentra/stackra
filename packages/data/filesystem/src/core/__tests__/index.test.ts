/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the configuration, its shipped schema under the generated name
 *          `FilesystemConfig$`, the shape, the memory disk and `FileNotFoundError` are exported, and nothing else is
 *          (the key checks and the driver-name list stay internal; the ports are `./contracts`').
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { FILESYSTEM_CONFIG_SCHEMA } from "#core/constants/filesystem-config-schema.constant";
import * as filesystem from "#core/index";

describe("@stackra/filesystem", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(filesystem).sort()).toEqual([
      "FileNotFoundError",
      "FilesystemConfig",
      "FilesystemConfig$",
      "FilesystemHealthIndicatorDriver",
      "FilesystemOptions",
      "MemoryFileSystemDriver",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(filesystem.FilesystemConfig$).toBe(FILESYSTEM_CONFIG_SCHEMA);
  });
});
