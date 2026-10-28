/**
 * Stackra file contract:
 * Purpose: unit tests of `linkedVendors`: each platform links only the listed families it has an SDK for, none when
 *          none are listed, and an unknown family throws at prebuild.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 2); ADR 0442 (decision 3); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { linkedVendors } from "#plugin/functions/linked-vendors.function";
import type { ReceiptPrinterPluginProps } from "#plugin/types/receipt-printer-plugin-props.type";

describe("linkedVendors", () => {
  it("links the listed families each platform has an SDK for, in table order", () => {
    const props: ReceiptPrinterPluginProps = { vendors: ["pax", "star", "sunmi", "epson", "star"] };
    expect(linkedVendors(props, "android")).toEqual(["epson", "star", "sunmi", "pax"]);
    expect(linkedVendors(props, "ios")).toEqual(["epson", "star"]);
  });

  it("links none when none are listed", () => {
    expect(linkedVendors({}, "android")).toEqual([]);
    expect(linkedVendors({ vendors: ["sunmi"] }, "ios")).toEqual([]);
  });

  it("throws on an unknown family", () => {
    const props = { vendors: ["bixolon"] } as unknown as ReceiptPrinterPluginProps;
    expect(() => linkedVendors(props, "android")).toThrow(/unknown vendor "bixolon"/);
  });
});
