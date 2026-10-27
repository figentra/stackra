/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `DeviceRegistry` port: keyed `devices.DeviceRegistry`, its memory driver an
 *          instance, claiming answering a registered device and taking optional claim facts.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0361 (decision 7); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DeviceRegistry } from "#contracts/ports/device-registry.port";
import type { DeviceClaimFacts } from "#contracts/types/device-claim-facts.type";
import type { RegisteredDevice } from "#contracts/types/registered-device.type";
import { MemoryDeviceRegistryDriver } from "#core/drivers/memory-device-registry.driver";

describe("DeviceRegistry", () => {
  it("is a port its drivers are instances of", () => {
    const registry = new MemoryDeviceRegistryDriver();
    expect(registry).toBeInstanceOf(DeviceRegistry);
    expect(registry).toBeInstanceOf(Port);
  });

  it("is keyed devices.DeviceRegistry and types its calls", () => {
    expectTypeOf<DeviceRegistry["~key"]>().toEqualTypeOf<"devices.DeviceRegistry">();
    expectTypeOf<DeviceRegistry["claim"]>().returns.toEqualTypeOf<Promise<RegisteredDevice>>();
    expectTypeOf<DeviceRegistry["claim"]>()
      .parameter(3)
      .toEqualTypeOf<DeviceClaimFacts | undefined>();
    expectTypeOf<RegisteredDevice["scopeId"]>().toEqualTypeOf<string | null>();
  });
});
