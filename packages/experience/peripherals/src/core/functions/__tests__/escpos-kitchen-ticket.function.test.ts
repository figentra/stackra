/**
 * Stackra file contract:
 * Purpose: unit tests of `escposKitchenTicket`: a text ticket prints as `escposReceipt` does, a raster ticket prints as
 *          `GS v 0` with its size and rows, a configured buzzer appends `ESC B n t`, and a raster whose data does not
 *          match its size throws.
 * Boundary: test only; pure bytes, no printer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decision 2); ADR 0449 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { escposKitchenTicket } from "#core/functions/escpos-kitchen-ticket.function";
import { escposReceipt } from "#core/functions/escpos-receipt.function";

const TICKET = { orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] };

describe("escposKitchenTicket", () => {
  it("prints a text ticket as a receipt, silently with no buzzer", () => {
    expect(escposKitchenTicket(TICKET, null)).toEqual(escposReceipt(TICKET.lines));
  });

  it("prints the raster instead of the lines, then cuts and beeps", () => {
    const raster = { width: 16, height: 2, data: Uint8Array.from([0xff, 0x00, 0x0f, 0xf0]) };
    const bytes = [...escposKitchenTicket({ ...TICKET, raster }, { times: 2, length: 3 })];
    expect(bytes.slice(0, 2)).toEqual([0x1b, 0x40]);
    expect(bytes.slice(2, 14)).toEqual([0x1d, 0x76, 0x30, 0, 2, 0, 2, 0, 0xff, 0x00, 0x0f, 0xf0]);
    expect(bytes.slice(14)).toEqual([0x1b, 0x64, 4, 0x1d, 0x56, 0x01, 0x1b, 0x42, 2, 3]);
  });

  it("refuses a raster whose data does not match its size", () => {
    const raster = { width: 9, height: 1, data: Uint8Array.from([0xff]) };
    expect(() => escposKitchenTicket({ ...TICKET, raster }, null)).toThrow(RangeError);
  });
});
