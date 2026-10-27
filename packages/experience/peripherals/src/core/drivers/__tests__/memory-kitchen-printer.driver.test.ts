/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryKitchenPrinterDriver`: it is a `KitchenPrinter`, records each ticket for any station,
 *          and refuses with capability `print` while absent.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0449 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { KitchenPrinter } from "#contracts/ports/kitchen-printer.port";
import { MemoryKitchenPrinterDriver } from "#core/drivers/memory-kitchen-printer.driver";

const TICKET = { orderId: "ord_1", station: "grill", lines: ["2x Shawarma"] };

describe("MemoryKitchenPrinterDriver", () => {
  it("records each ticket and names itself the printer", async () => {
    const kitchen = new MemoryKitchenPrinterDriver();
    expect(kitchen).toBeInstanceOf(KitchenPrinter);
    expect(await kitchen.probe("grill")).toEqual({ ok: true, data: undefined });
    expect(await kitchen.print(TICKET)).toEqual({
      ok: true,
      data: { printer: "memory", orderId: "ord_1" },
    });
    expect(kitchen.printed).toEqual([TICKET]);
  });

  it("refuses while absent", async () => {
    const kitchen = new MemoryKitchenPrinterDriver();
    kitchen.isPresent = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "print" } };
    expect(await kitchen.probe("grill")).toEqual(refused);
    expect(await kitchen.print(TICKET)).toEqual(refused);
    expect(kitchen.printed).toEqual([]);
  });
});
