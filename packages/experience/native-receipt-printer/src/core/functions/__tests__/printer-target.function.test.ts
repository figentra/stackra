/**
 * Stackra file contract:
 * Purpose: unit tests of `printerTarget`: a built-in printer's empty target, each network vendor's spelling of a
 *          `tcp://` address (IPv4, a name, IPv6), and no target for an empty address or a device path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { RECEIPT_PRINTER_VENDORS } from "#core/constants/receipt-printer-vendors.constant";
import { printerTarget } from "#core/functions/printer-target.function";

describe("printerTarget", () => {
  it("is empty for a built-in printer, whatever the address", () => {
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.sunmi, "")).toBe("");
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.pax, "tcp://10.0.0.20:9100")).toBe("");
  });

  it("spells a network host the vendor's way", () => {
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.epson, "tcp://10.0.0.20:9100")).toBe(
      "TCP:10.0.0.20",
    );
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.star, "tcp://receipt.local:9100")).toBe(
      "receipt.local",
    );
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.star, "tcp://[fe80::1]:9100")).toBe("[fe80::1]");
  });

  it("has no target for no address or a device path", () => {
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.epson, "")).toBeUndefined();
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.epson, "/dev/usb/lp0")).toBeUndefined();
    expect(printerTarget(RECEIPT_PRINTER_VENDORS.star, "\\\\localhost\\Receipt")).toBeUndefined();
  });
});
