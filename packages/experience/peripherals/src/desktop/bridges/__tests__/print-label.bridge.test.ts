/**
 * Stackra file contract:
 * Purpose: unit tests of `PrintLabelBridge`: a bridge keyed `label.print` of the `print` capability that prints the
 *          renderer's ZPL or raster label on the bound printer, refuses malformed, oversized or unsafe input (a `~`
 *          host command, a `^J` setup command, two labels) before the printer is touched, and turns a printer's
 *          refusal into `LabelPrinterUnavailableError`.
 * Boundary: test only; the printer is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0251 (decisions 1 to 3); ADR 0339 (decisions 1, 2 and 5).
 */
import { kindOf } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat } from "#contracts/enums/label-format.enum";
import type { Label } from "#contracts/types/label.type";
import { MemoryLabelPrinterDriver } from "#core/drivers/memory-label-printer.driver";
import { LabelPrinterUnavailableError } from "#core/errors/label-printer-unavailable.error";
import { PrintLabelBridge } from "#desktop/bridges/print-label.bridge";

const ZPL: Label = { jobId: "job_1", copies: 1, format: LabelFormat.Zpl, zpl: "^XA^FDSKU 1^FS^XZ" };

describe("PrintLabelBridge", () => {
  it("is the peripherals.label.print bridge of the print capability", () => {
    expect(kindOf(PrintLabelBridge)).toEqual({
      kind: "bridge",
      options: { key: "label.print", capability: "print" },
    });
  });

  it("prints a ZPL or raster label and answers the printer", async () => {
    const printer = new MemoryLabelPrinterDriver();
    const bridge = new PrintLabelBridge(printer);
    expect(await bridge.handle(ZPL)).toEqual({ printer: "memory", jobId: "job_1" });
    const raster: Label = {
      jobId: "job_2",
      copies: 2,
      format: LabelFormat.Raster,
      raster: { width: 16, height: 1, data: Uint8Array.of(0xff, 0x00) },
    };
    await bridge.handle(raster);
    expect(printer.printed).toEqual([ZPL, raster]);
  });

  it("refuses malformed or unsafe input before the printer", async () => {
    const printer = new MemoryLabelPrinterDriver();
    const bridge = new PrintLabelBridge(printer);
    for (const input of [
      null,
      { ...ZPL, jobId: "" },
      { ...ZPL, copies: 0 },
      { ...ZPL, copies: 1.5 },
      { ...ZPL, format: "epl" },
      { ...ZPL, zpl: "^FDno start^FS" },
      { ...ZPL, zpl: "^XA~JR^XZ" },
      { ...ZPL, zpl: "^XA^JUS^XZ" },
      { ...ZPL, zpl: "^XA^FD1^FS^XZ^XA^FD2^FS^XZ" },
      { ...ZPL, zpl: `^XA${"x".repeat(65_536)}^XZ` },
      {
        jobId: "job_3",
        copies: 1,
        format: "raster",
        raster: { width: 9, height: 1, data: Uint8Array.of(1) },
      },
      { jobId: "job_3", copies: 1, format: "raster", raster: { width: 8, height: 1, data: [1] } },
    ])
      await expect(bridge.handle(input as unknown as Label)).rejects.toThrow(TypeError);
    expect(printer.printed).toEqual([]);
  });

  it("turns a refused print into LabelPrinterUnavailableError", async () => {
    const printer = new MemoryLabelPrinterDriver();
    printer.isPresent = false;
    const error = await new PrintLabelBridge(printer)
      .handle(ZPL)
      .catch((caughtError: unknown) => caughtError);
    expect(isRefusal(error, LabelPrinterUnavailableError)).toBe(true);
  });
});
