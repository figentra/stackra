/**
 * Stackra file contract:
 * Purpose: unit tests of `RECEIPT_PRINTER_VENDORS`: exactly the four families, each one's reach, target spelling and
 *          ready codes as the vendor SDK documents give them, and a frozen table.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0459 (decision 3); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";

describe("RECEIPT_PRINTER_VENDORS", () => {
  it("names the four vendor families", () => {
    expect(RECEIPT_PRINTER_VENDORS).toEqual({
      epson: { name: "epson", reach: "network", targetPrefix: "TCP:", printerReady: [1] },
      star: { name: "star", reach: "network", targetPrefix: "", printerReady: [0] },
      sunmi: { name: "sunmi", reach: "built-in", targetPrefix: "", printerReady: [1] },
      pax: { name: "pax", reach: "built-in", targetPrefix: "", printerReady: [0] },
    });
    expect(Object.isFrozen(RECEIPT_PRINTER_VENDORS)).toBe(true);
  });
});
