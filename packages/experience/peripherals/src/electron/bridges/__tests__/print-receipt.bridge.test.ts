/**
 * Stackra file contract:
 * Purpose: unit tests of `PrintReceiptBridge`: a bridge keyed `receipt.print` of the `print` capability that prints the
 *          renderer's receipt on the bound printer and answers which printer took it (the template's desktop e2e
 *          shape), refuses malformed or oversized input before the printer is touched, and turns a printer's refusal
 *          into `PrinterUnavailableError`.
 * Boundary: test only; the printer is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0251 (decisions 1 to 3); ADR 0253 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";
import { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";
import { PrintReceiptBridge } from "#electron/bridges/print-receipt.bridge";

const RECEIPT = { orderId: "ord_01JA0000000000000000000001", lines: ["Total 12.00"] };

describe("PrintReceiptBridge", () => {
  it("is the peripherals.receipt.print bridge of the print capability", () => {
    expect(kindOf(PrintReceiptBridge)).toEqual({
      kind: "bridge",
      options: { key: "receipt.print", capability: "print" },
    });
  });

  it("prints the receipt and answers the printer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    expect(await new PrintReceiptBridge(printer).handle(RECEIPT)).toEqual({
      printer: "memory",
      orderId: RECEIPT.orderId,
    });
    expect(printer.printed).toEqual([RECEIPT]);
  });

  it("refuses malformed input before the printer", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    const bridge = new PrintReceiptBridge(printer);
    for (const input of [
      null,
      { lines: ["x"] },
      { orderId: "", lines: [] },
      { orderId: "o".repeat(65), lines: [] },
      { orderId: "ord_1" },
      { orderId: "ord_1", lines: "Total" },
      { orderId: "ord_1", lines: [12] },
      { orderId: "ord_1", lines: ["x".repeat(257)] },
      { orderId: "ord_1", lines: Array.from({ length: 1001 }, () => "x") },
    ])
      await expect(bridge.handle(input as never)).rejects.toThrow(TypeError);
    expect(printer.printed).toEqual([]);
  });

  it("turns a printer's refusal into PrinterUnavailableError", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    printer.isPresent = false;
    const refused = await new PrintReceiptBridge(printer).handle(RECEIPT).catch((error) => error);
    expect(isRefusal(refused, PrinterUnavailableError)).toBe(true);
    expect((refused as PrinterUnavailableError).details).toEqual({ reason: "unavailable" });
  });
});
