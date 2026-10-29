/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry of @stackra/native-share: exactly the configuration, its schema, the
 *          driver base, the memory driver and the keep, path and upload helpers, each under one name.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/native-share", () => {
  // A module namespace lists its names sorted, so the order here is fixed.
  it("exports exactly its public names", () => {
    expect(Object.keys(core)).toEqual([
      "IncomingShareDriver",
      "MemoryIncomingShareDriver",
      "NATIVE_SHARE_CONFIG_SCHEMA",
      "NativeShareConfig",
      "NativeShareConfig$",
      "NativeShareOptions",
      "keepSharedItem",
      "sharedItemPath",
      "uploadSharedItem",
    ]);
  });
});
