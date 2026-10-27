/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryLabelScaleDriver`: it is a `LabelScale`, adds and replaces items per scale by item
 *          code, removes them, and refuses with capability `network` for an offline scale, keeping its items.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { LabelScale } from "#contracts/ports/label-scale.port";
import type { LabelScaleItem } from "#contracts/types/label-scale-item.type";
import { MemoryLabelScaleDriver } from "#core/drivers/memory-label-scale.driver";

const HALLOUMI: LabelScaleItem = {
  itemCode: "12345",
  name: "Halloumi",
  price: "42.00",
  currency: "SAR",
  byWeight: true,
  tareGrams: 5,
  effectiveAt: null,
};
const OLIVES: LabelScaleItem = { ...HALLOUMI, itemCode: "12346", name: "Olives" };

describe("MemoryLabelScaleDriver", () => {
  it("adds, replaces and removes items per scale", async () => {
    const scales = new MemoryLabelScaleDriver();
    expect(scales).toBeInstanceOf(LabelScale);
    expect(await scales.probe("deli_1")).toEqual({ ok: true, data: undefined });
    expect(await scales.sync("deli_1", [HALLOUMI, OLIVES])).toEqual({
      ok: true,
      data: ["12345", "12346"],
    });
    const repriced = { ...HALLOUMI, price: "39.50", effectiveAt: "2026-11-01T00:00:00Z" };
    await scales.sync("deli_1", [repriced]);
    expect(scales.items("deli_1")).toEqual([repriced, OLIVES]);
    expect(scales.items("deli_2")).toEqual([]);
    expect(await scales.remove("deli_1", ["12346", "99999"])).toEqual({
      ok: true,
      data: undefined,
    });
    expect(scales.items("deli_1")).toEqual([repriced]);
  });

  it("refuses for an offline scale and keeps its items", async () => {
    const scales = new MemoryLabelScaleDriver();
    await scales.sync("deli_1", [HALLOUMI]);
    scales.offline.add("deli_1");
    const refused = { ok: false, error: { code: "unavailable", capability: "network" } };
    expect(await scales.probe("deli_1")).toEqual(refused);
    expect(await scales.sync("deli_1", [OLIVES])).toEqual(refused);
    expect(await scales.remove("deli_1", ["12345"])).toEqual(refused);
    expect(scales.items("deli_1")).toEqual([HALLOUMI]);
  });
});
