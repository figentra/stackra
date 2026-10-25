/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `ReceiptPrinter` port: a port base keyed `peripherals.ReceiptPrinter` whose
 *          drivers are instances of it, with its probe, print and drawer-kick signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253 (decision 4); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
import type { Receipt } from "#contracts/types/receipt.type";
import { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";

describe("ReceiptPrinter", () => {
  it("is a port its drivers are instances of", () => {
    const printer = new MemoryReceiptPrinterDriver();
    expect(printer).toBeInstanceOf(ReceiptPrinter);
    expect(printer).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.ReceiptPrinter and types its calls", () => {
    expectTypeOf<ReceiptPrinter["~key"]>().toEqualTypeOf<"peripherals.ReceiptPrinter">();
    expectTypeOf<ReceiptPrinter["probe"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<ReceiptPrinter["print"]>().parameter(0).toEqualTypeOf<Receipt>();
    expectTypeOf<ReceiptPrinter["print"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<PrintedReceipt>>
    >();
    expectTypeOf<ReceiptPrinter["kickDrawer"]>().parameter(0).toEqualTypeOf<DrawerPin>();
  });
});
