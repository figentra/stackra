/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalDevice`: an abstract port a host implements; `call` relays a command.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDevice } from "#contracts/ports/fiscal-device.port";

/** A host binding that echoes the command. */
class EchoDevice extends FiscalDevice {
  async call(unitId: string, command: string): Promise<unknown> {
    return { unitId, command };
  }
}

describe("FiscalDevice", () => {
  it("is a port that relays a command to the unit's device", async () => {
    const device: FiscalDevice = new EchoDevice();
    expect(device).toBeInstanceOf(Port);
    expect(await device.call("u", "tse.export", {})).toEqual({
      unitId: "u",
      command: "tse.export",
    });
  });
});
