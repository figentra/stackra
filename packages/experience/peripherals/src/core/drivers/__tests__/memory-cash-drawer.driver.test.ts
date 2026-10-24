/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCashDrawerDriver`: a present drawer counts its opens; an absent one refuses with
 *          `unavailable` on `print` and counts nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryCashDrawerDriver } from "#core/drivers/memory-cash-drawer.driver";

describe("MemoryCashDrawerDriver", () => {
  it("counts opens", async () => {
    const drawer = new MemoryCashDrawerDriver();
    expect(await drawer.probe()).toEqual({ ok: true, data: undefined });
    expect(await drawer.open()).toEqual({ ok: true, data: undefined });
    await drawer.open();
    expect(drawer.opened).toBe(2);
  });

  it("refuses while absent", async () => {
    const drawer = new MemoryCashDrawerDriver();
    drawer.isPresent = false;
    const refused = { ok: false, error: { code: "unavailable", capability: "print" } };
    expect(await drawer.probe()).toEqual(refused);
    expect(await drawer.open()).toEqual(refused);
    expect(drawer.opened).toBe(0);
  });
});
