/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `DeviceIdentity` port: a `Port` keyed `devices.DeviceIdentity` whose subclass
 *          answers the device's id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 1).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DeviceIdentity } from "#contracts/ports/device-identity.port";

describe("DeviceIdentity", () => {
  it("is a keyed port a driver implements", async () => {
    class FixedDeviceIdentity extends DeviceIdentity {
      id(): Promise<string> {
        return Promise.resolve("device-1");
      }
    }
    const device = new FixedDeviceIdentity();
    expect(device).toBeInstanceOf(Port);
    expect(await device.id()).toBe("device-1");
    expectTypeOf<DeviceIdentity["~key"]>().toEqualTypeOf<"devices.DeviceIdentity">();
  });
});
