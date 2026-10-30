/**
 * Stackra file contract:
 * Purpose: `MemoryDeviceStatusReaderDriver`, the in-process `DeviceStatusReader`: the revoked device ids in a set, for
 *          tests, local runs and single-instance memory deployments.
 * Boundary: one process only; a restart forgets every revocation, so bind the devices service's driver beyond tests and
 *           local runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (device order); ADR 0361 (decision 7).
 */
import { Driver } from "@stackra/container";

import { DeviceStatusReader } from "#contracts/ports/device-status-reader.port";

/**
 * Keeps revoked device ids in memory.
 *
 * @example
 * const reader = new MemoryDeviceStatusReaderDriver();
 * reader.revoke("dev_1");
 * await reader.isRevoked("dev_1"); // true
 */
export class MemoryDeviceStatusReaderDriver extends Driver(DeviceStatusReader) {
  /** The revoked device ids. */
  private readonly revoked = new Set<string>();

  /** Marks `deviceId` revoked. */
  revoke(deviceId: string): void {
    this.revoked.add(deviceId);
  }

  /** Whether `deviceId` is revoked. */
  async isRevoked(deviceId: string): Promise<boolean> {
    return this.revoked.has(deviceId);
  }
}
