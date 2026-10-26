/**
 * Stackra file contract:
 * Purpose: unit tests of the `DeviceSequenceStore` port: it is an abstract `Port` (its own token, never built directly)
 *          and a driver reads and settles a device's sequence.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0263 (ports); ADR 0338 (decision 1).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeviceSequenceStore } from "#contracts/ports/device-sequence-store.port";
import type { DeviceSequence } from "#contracts/types/device-sequence.type";

class SingleDeviceDriver extends Driver(DeviceSequenceStore) {
  known: DeviceSequence | undefined;

  async last(): Promise<DeviceSequence | undefined> {
    return this.known;
  }

  async settle(deviceId: string, sequence: number, at: Date): Promise<void> {
    if (sequence > (this.known?.sequence ?? 0)) this.known = { deviceId, sequence, settledAt: at };
  }
}

describe("DeviceSequenceStore", () => {
  it("is an abstract port", () => {
    expect(DeviceSequenceStore.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver: DeviceSequenceStore = new SingleDeviceDriver();
    const at = new Date("2026-10-25T09:00:00Z");
    await driver.settle("dev_1", 1, at, undefined);
    expect(await driver.last()).toEqual({ deviceId: "dev_1", sequence: 1, settledAt: at });
  });
});
