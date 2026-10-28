/**
 * Stackra file contract:
 * Purpose: unit tests of `linkedVendors`: Android links only the listed drawer port families, each once, none when
 *          none are listed, and an unknown family throws at prebuild.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 2); ADR 0442 (decision 3); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { linkedVendors } from "#plugin/functions/linked-vendors.function";
import type { CashDrawerPluginProps } from "#plugin/types/cash-drawer-plugin-props.type";

describe("linkedVendors", () => {
  it("links the listed families once, in table order", () => {
    expect(linkedVendors({ vendors: ["pax", "sunmi", "pax"] })).toEqual(["sunmi", "pax"]);
    expect(linkedVendors({ vendors: ["pax"] })).toEqual(["pax"]);
  });

  it("links none when none are listed", () => {
    expect(linkedVendors({})).toEqual([]);
  });

  it("throws on an unknown family, such as a printer family", () => {
    const props = { vendors: ["epson"] } as unknown as CashDrawerPluginProps;
    expect(() => linkedVendors(props)).toThrow(/unknown vendor "epson"/);
  });
});
