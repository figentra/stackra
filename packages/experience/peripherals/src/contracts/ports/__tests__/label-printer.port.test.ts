/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `LabelPrinter` port: keyed `peripherals.LabelPrinter`, its drivers instances of
 *          it, with its probe and print signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { PrintedLabel } from "#contracts/types/printed-label.type";
import { MemoryLabelPrinterDriver } from "#core/drivers/memory-label-printer.driver";

describe("LabelPrinter", () => {
  it("is a port its drivers are instances of", () => {
    const printer = new MemoryLabelPrinterDriver();
    expect(printer).toBeInstanceOf(LabelPrinter);
    expect(printer).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.LabelPrinter and types its calls", () => {
    expectTypeOf<LabelPrinter["~key"]>().toEqualTypeOf<"peripherals.LabelPrinter">();
    expectTypeOf<LabelPrinter["print"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<PrintedLabel>>
    >();
  });
});
