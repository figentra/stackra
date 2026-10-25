/**
 * Stackra file contract:
 * Purpose: unit tests of `deviceExport`: the device is asked for the span of the records and its file is relayed; no
 *          records is an empty file.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { deviceExport } from "#core/functions/device-export.function";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

describe("deviceExport", () => {
  it("asks for the span and relays the file", async () => {
    const device = FiscalDeviceFake.with({
      "x.export": { fileName: "a.tar", contentType: "application/x-tar", content: "AAA=" },
    });
    const last = fiscalRecord({ sequence: 2, sealedAt: new Date("2026-03-02T00:00:00Z") });
    const file = await deviceExport(device, "x.export", [fiscalRecord(), last], "till_1", "x");
    expect(file).toEqual({
      fileName: "a.tar",
      contentType: "application/x-tar",
      encoding: "base64",
      content: "AAA=",
    });
    expect(device.calls("call")).toEqual([
      {
        unitId: "till_1",
        command: "x.export",
        payload: {
          from: "2026-03-01T09:30:00.000Z",
          to: "2026-03-02T00:00:00.000Z",
          fromSequence: 1,
          toSequence: 2,
        },
      },
    ]);
  });

  it("returns an empty file without asking when there are no records", async () => {
    const device = FiscalDeviceFake.with({});
    expect((await deviceExport(device, "x.export", [], "till_1", "x")).content).toBe("");
    expect(device.calls("call")).toEqual([]);
  });
});
