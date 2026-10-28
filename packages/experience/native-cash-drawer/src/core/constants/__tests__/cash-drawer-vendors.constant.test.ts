/**
 * Stackra file contract:
 * Purpose: unit tests of `CASH_DRAWER_VENDORS`: exactly the Sunmi and PAX families with the ready codes of the printer
 *          that drives the drawer, as the vendor SDK documents give them, and a frozen table.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0458 (decision 3); ADR 0459 (decision 3); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { CASH_DRAWER_VENDORS } from "#core/constants/cash-drawer-vendors.constant";

describe("CASH_DRAWER_VENDORS", () => {
  it("names the two drawer port families", () => {
    expect(CASH_DRAWER_VENDORS).toEqual({
      sunmi: { name: "sunmi", printerReady: [1] },
      pax: { name: "pax", printerReady: [0] },
    });
    expect(Object.isFrozen(CASH_DRAWER_VENDORS)).toBe(true);
  });
});
