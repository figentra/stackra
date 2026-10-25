/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCustomerDisplayDriver`: it shows and clears into memory and refuses with
 *          `unavailable` on `window` when absent.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339.
 */
import { describe, expect, it } from "@stackra/testing";

import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { MemoryCustomerDisplayDriver } from "#core/drivers/memory-customer-display.driver";

const VIEW: CustomerDisplayView = {
  lines: [{ label: "Latte", amount: "SAR 18.00" }],
  total: "SAR 18.00",
  message: null,
};

describe("MemoryCustomerDisplayDriver", () => {
  it("shows and clears", async () => {
    const display = new MemoryCustomerDisplayDriver();
    expect(await display.show(VIEW)).toEqual({ ok: true, data: undefined });
    expect(display.current).toEqual(VIEW);
    await display.clear();
    expect(display.current).toBeNull();
    expect(display.shown).toEqual([VIEW]);
  });

  it("refuses when absent", async () => {
    const display = new MemoryCustomerDisplayDriver();
    display.isPresent = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "window" } };
    expect(await display.probe()).toEqual(refused);
    expect(await display.show(VIEW)).toEqual(refused);
    expect(await display.clear()).toEqual(refused);
  });
});
