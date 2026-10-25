/**
 * Stackra file contract:
 * Purpose: unit tests of `ZplLabelPrinterDriver`: a ZPL label is sent with its copies before the closing `^XZ`, a
 *          raster label as a graphic field, the probe sends nothing, and no address, a refused connection or
 *          `EACCES` resolve the matching refusal.
 * Boundary: test only; `sendToPrinter` is mocked, so no socket or device is opened.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decisions 1, 2 and 5); ADR 0250 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import { LabelFormat } from "#contracts/enums/label-format.enum";
import { LabelPrinter } from "#contracts/ports/label-printer.port";
import { ZplLabelPrinterDriver } from "#desktop/drivers/zpl-label-printer.driver";

const send = vi.hoisted(() => vi.fn(async (_address: string, _bytes: Uint8Array) => undefined));

vi.mock("#desktop/functions/send-to-printer.function", () => ({ sendToPrinter: send }));

/** The driver over `labelPrinterAddress`. */
function driver(labelPrinterAddress: string): ZplLabelPrinterDriver {
  return new ZplLabelPrinterDriver(
    buildConfig(PeripheralsConfig, { values: { labelPrinter: "zpl", labelPrinterAddress } }),
  );
}

/** The text of the `index`th send. */
const sent = (index: number) => new TextDecoder().decode(send.mock.calls[index]?.[1]);

beforeEach(() => send.mockReset().mockResolvedValue(undefined));

describe("ZplLabelPrinterDriver", () => {
  it("is a LabelPrinter", () => {
    expect(driver("tcp://10.0.0.21:9100")).toBeInstanceOf(LabelPrinter);
  });

  it("sends ZPL with its copies and answers the printer", async () => {
    const printer = driver("tcp://10.0.0.21:9100");
    const result = await printer.print({
      jobId: "job_1",
      copies: 3,
      format: LabelFormat.Zpl,
      zpl: "^XA^FO50,50^FDSKU 1^FS^XZ",
    });
    expect(result).toEqual({ ok: true, data: { printer: "tcp://10.0.0.21:9100", jobId: "job_1" } });
    expect(send.mock.calls[0]?.[0]).toBe("tcp://10.0.0.21:9100");
    expect(sent(0)).toBe("^XA^FO50,50^FDSKU 1^FS^PQ3^XZ");
  });

  it("sends a raster label as a graphic field", async () => {
    await driver("/dev/usb/lp1").print({
      jobId: "job_2",
      copies: 1,
      format: LabelFormat.Raster,
      raster: { width: 8, height: 1, data: Uint8Array.of(0xff) },
    });
    expect(sent(0)).toBe("^XA^FO0,0^GFA,1,1,1,FF^FS^PQ1^XZ");
  });

  it("probes by sending nothing", async () => {
    expect(await driver("tcp://10.0.0.21:9100").probe()).toEqual({ ok: true, data: undefined });
    expect(send.mock.calls[0]?.[1]).toEqual(new Uint8Array(0));
  });

  it("refuses with no address, a failed send or a denied device", async () => {
    expect(await driver("").probe()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "print" },
    });
    send.mockRejectedValueOnce(Object.assign(new Error("refused"), { code: "ECONNREFUSED" }));
    expect(await driver("tcp://10.0.0.21:9100").probe()).toMatchObject({
      ok: false,
      error: { code: "unavailable" },
    });
    send.mockRejectedValueOnce(Object.assign(new Error("denied"), { code: "EACCES" }));
    expect(await driver("/dev/usb/lp1").probe()).toMatchObject({
      ok: false,
      error: { code: "permission_denied" },
    });
  });
});
