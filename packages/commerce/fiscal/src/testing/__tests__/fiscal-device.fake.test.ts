/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalDeviceFake`: answers by command, records calls, and throws for an unknown command.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalDevice } from "#contracts/ports/fiscal-device.port";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";

describe("FiscalDeviceFake", () => {
  it("answers by command and records", async () => {
    const device = FiscalDeviceFake.with({ ping: { ok: true } });
    expect(device).toBeInstanceOf(FiscalDevice);
    expect(await device.call("u", "ping", {})).toEqual({ ok: true });
    await expect(device.call("u", "other", {})).rejects.toThrow(/no answer/);
    expect(device.calls("call")).toEqual([
      { unitId: "u", command: "ping", payload: {} },
      { unitId: "u", command: "other", payload: {} },
    ]);
  });
});
