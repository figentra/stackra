/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the configuration and its schema, the rules, the indexer and the
 *          memory driver, and the record and session types.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import type { DeviceSearchRecord, DeviceSession } from "#core/index";

describe("@stackra/native-spotlight", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "MemoryDeviceSearchIndexDriver",
      "SpotlightConfig",
      "SpotlightConfig$",
      "SpotlightIndexer",
      "indexableItems",
    ]);
  });

  it("exports the record and session types", () => {
    expectTypeOf<DeviceSearchRecord["isSensitive"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ReturnType<DeviceSession["isRevoked"]["get"]>>().toEqualTypeOf<boolean>();
  });
});
