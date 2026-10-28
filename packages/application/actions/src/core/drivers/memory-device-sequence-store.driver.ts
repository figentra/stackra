/**
 * Stackra file contract:
 * Purpose: `MemoryDeviceSequenceStoreDriver`, the in-process `DeviceSequenceStore`: each device's last settled sequence
 *          in a map, for tests, local runs and single-instance memory deployments.
 * Boundary: one process only; a restart forgets every device, so a resend of an already settled call is applied
 *           again unless its Idempotency-Key still replays; bind the durable driver beyond tests and local runs.
 *           `settle` never awaits between its read and its write, so it is atomic here.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { DeviceSequenceStore } from "#contracts/ports/device-sequence-store.port";
import type { DeviceSequence } from "#contracts/types/device-sequence.type";

/**
 * Keeps device sequences in memory.
 *
 * @example
 * const store = new MemoryDeviceSequenceStoreDriver();
 * await store.settle("dev_1", 1, new Date(), undefined);
 * (await store.last("dev_1"))?.sequence; // 1
 */
export class MemoryDeviceSequenceStoreDriver extends Driver(DeviceSequenceStore) {
  /** Device id to its last settled call. */
  private readonly devices = new Map<string, DeviceSequence>();

  /** The device's last settled call. */
  async last(deviceId: string): Promise<DeviceSequence | undefined> {
    return this.devices.get(deviceId);
  }

  /** Advances the device to `sequence` when it is above the last; sequences are not contiguous. */
  async settle(
    deviceId: string,
    sequence: number,
    at: Date,
    scope: ScopeRef | undefined,
  ): Promise<void> {
    if (sequence <= (this.devices.get(deviceId)?.sequence ?? 0)) return;
    this.devices.set(
      deviceId,
      Object.freeze({
        deviceId,
        sequence,
        settledAt: new Date(at),
        ...(scope === undefined ? {} : { scope }),
      }),
    );
  }
}
