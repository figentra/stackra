/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLabelPrinterDriver`: it records each label and answers `memory` with the job, and
 *          refuses with `unavailable` on `print` when absent.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339.
 */
import { describe, expect, it } from "@stackra/testing";

import { LabelFormat } from "#contracts/enums/label-format.enum";
import type { Label } from "#contracts/types/label.type";
import { MemoryLabelPrinterDriver } from "#core/drivers/memory-label-printer.driver";

const LABEL: Label = { jobId: "job_1", copies: 2, format: LabelFormat.Zpl, zpl: "^XA^FDHi^FS^XZ" };

describe("MemoryLabelPrinterDriver", () => {
  it("prints into memory", async () => {
    const printer = new MemoryLabelPrinterDriver();
    expect(await printer.probe()).toEqual({ ok: true, data: undefined });
    expect(await printer.print(LABEL)).toEqual({
      ok: true,
      data: { printer: "memory", jobId: "job_1" },
    });
    expect(printer.printed).toEqual([LABEL]);
  });

  it("refuses when absent", async () => {
    const printer = new MemoryLabelPrinterDriver();
    printer.isPresent = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "print" } };
    expect(await printer.probe()).toEqual(refused);
    expect(await printer.print(LABEL)).toEqual(refused);
    expect(printer.printed).toEqual([]);
  });
});
