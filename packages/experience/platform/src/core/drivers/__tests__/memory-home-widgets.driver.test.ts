/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryHomeWidgetsDriver`: a publish replaces the glance, and an unavailable target refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1539.
 */
import { describe, expect, it } from "@stackra/testing";

import { HomeWidgets } from "#contracts/ports/home-widgets.port";
import { MemoryHomeWidgetsDriver } from "#core/drivers/memory-home-widgets.driver";

describe("MemoryHomeWidgetsDriver", () => {
  it("is a HomeWidgets driver whose last publish wins", async () => {
    const widgets = new MemoryHomeWidgetsDriver();
    expect(widgets).toBeInstanceOf(HomeWidgets);
    await widgets.publish({ title: "Orders", value: "41" });
    expect(await widgets.publish({ title: "Orders", value: "42" })).toEqual({
      ok: true,
      data: undefined,
    });
    expect(widgets.published).toEqual({ title: "Orders", value: "42" });
  });

  it("refuses as unavailable on a target without widgets", async () => {
    const widgets = new MemoryHomeWidgetsDriver();
    widgets.isAvailable = false;
    expect(await widgets.publish({ title: "Orders", value: "42" })).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "home_widget" },
    });
    expect(widgets.published).toBeUndefined();
  });
});
