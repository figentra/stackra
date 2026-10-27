/**
 * Stackra file contract:
 * Purpose: unit tests of `PrintKitchenTicketBridge`: a valid text or raster ticket reaches the bound kitchen printer
 *          and its result comes back; a missing or oversized id, bad lines or a raster whose size and data disagree
 *          throws `TypeError` before the printer is touched; a refusing printer throws `PrinterUnavailableError`.
 * Boundary: test only; the memory kitchen printer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0251 (decisions 1 to 3); ADR 0339 (decision 2); ADR 0449 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import type { KitchenTicket } from "#contracts/types/kitchen-ticket.type";
import { MemoryKitchenPrinterDriver } from "#core/drivers/memory-kitchen-printer.driver";
import { PrinterUnavailableError } from "#core/errors/printer-unavailable.error";
import { PrintKitchenTicketBridge } from "#desktop/bridges/print-kitchen-ticket.bridge";

const TICKET = { orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] };

describe("PrintKitchenTicketBridge", () => {
  it("prints a text or raster ticket on the bound printer", async () => {
    const kitchen = new MemoryKitchenPrinterDriver();
    const bridge = new PrintKitchenTicketBridge(kitchen);
    expect(await bridge.handle(TICKET)).toEqual({ printer: "memory", orderId: "ord_1" });
    const raster = { width: 8, height: 2, data: Uint8Array.from([0xff, 0x81]) };
    await bridge.handle({ ...TICKET, raster });
    expect(kitchen.printed).toEqual([TICKET, { ...TICKET, raster }]);
  });

  it("refuses malformed input before the printer is touched", async () => {
    const kitchen = new MemoryKitchenPrinterDriver();
    const bridge = new PrintKitchenTicketBridge(kitchen);
    for (const input of [
      undefined,
      { ...TICKET, orderId: "" },
      { ...TICKET, station: "x".repeat(65) },
      { ...TICKET, lines: "2x Shawarma" },
      { ...TICKET, lines: ["x".repeat(257)] },
      { ...TICKET, raster: { width: 9, height: 1, data: Uint8Array.from([0xff]) } },
      { ...TICKET, raster: { width: 8, height: 1, data: [0xff] } },
      { ...TICKET, raster: { width: 2048, height: 1, data: new Uint8Array(256) } },
    ])
      await expect(bridge.handle(input as unknown as KitchenTicket)).rejects.toThrow(TypeError);
    expect(kitchen.printed).toEqual([]);
  });

  it("throws PrinterUnavailableError when the printer refuses", async () => {
    const kitchen = new MemoryKitchenPrinterDriver();
    kitchen.isPresent = false;
    await expect(new PrintKitchenTicketBridge(kitchen).handle(TICKET)).rejects.toBeInstanceOf(
      PrinterUnavailableError,
    );
  });
});
