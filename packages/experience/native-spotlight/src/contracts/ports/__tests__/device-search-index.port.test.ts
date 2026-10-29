/**
 * Stackra file contract:
 * Purpose: unit tests of the `DeviceSearchIndex` port: its drivers are instances of it, and it is keyed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0478 (decision 5).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
import { MemoryDeviceSearchIndexDriver } from "#core/drivers/memory-device-search-index.driver";

describe("DeviceSearchIndex", () => {
  it("is a port its drivers are instances of", () => {
    const index = new MemoryDeviceSearchIndexDriver();
    expect(index).toBeInstanceOf(DeviceSearchIndex);
    expect(index).toBeInstanceOf(Port);
  });

  it("is keyed native-spotlight.DeviceSearchIndex", () => {
    expectTypeOf<DeviceSearchIndex["~key"]>().toEqualTypeOf<"native-spotlight.DeviceSearchIndex">();
  });
});
