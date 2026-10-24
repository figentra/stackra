/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryReceiptPrinterDriver`: a present printer records each receipt and drawer pulse and
 *          answers `memory` with the order id; an absent one refuses every call with `unavailable` on `print`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryReceiptPrinterDriver } from "#core/drivers/memory-receipt-printer.driver";

const RECEIPT = { orderId: "ord_1", lines: ["Total 12.00"] };

describe("MemoryReceiptPrinterDriver", () => {
  it("records receipts and drawer pulses in order", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    expect(await printer.probe()).toEqual({ ok: true, data: undefined });
    expect(await printer.print(RECEIPT)).toEqual({
      ok: true,
      data: { printer: "memory", orderId: "ord_1" },
    });
    expect(await printer.kickDrawer(5)).toEqual({ ok: true, data: undefined });
    expect(printer.printed).toEqual([RECEIPT]);
    expect(printer.kicks).toEqual([5]);
  });

  it("refuses every call while absent and records nothing", async () => {
    const printer = new MemoryReceiptPrinterDriver();
    printer.isPresent = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "print" } };
    expect(await printer.probe()).toEqual(refused);
    expect(await printer.print(RECEIPT)).toEqual(refused);
    expect(await printer.kickDrawer(2)).toEqual(refused);
    expect(printer.printed).toEqual([]);
    expect(printer.kicks).toEqual([]);
  });
});
