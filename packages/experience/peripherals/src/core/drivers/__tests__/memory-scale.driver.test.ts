/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryScaleDriver`: it reads an empty settled scale by default, then what a test sets, and
 *          refuses with `unavailable` on `serial` when the reading is null.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryScaleDriver } from "#core/drivers/memory-scale.driver";

describe("MemoryScaleDriver", () => {
  it("reads what is on it", async () => {
    const scale = new MemoryScaleDriver();
    expect(await scale.read()).toEqual({ ok: true, data: { grams: 0, isStable: true } });
    scale.reading = { grams: 1250, isStable: false };
    expect(await scale.probe()).toEqual({ ok: true, data: undefined });
    expect(await scale.read()).toEqual({ ok: true, data: { grams: 1250, isStable: false } });
  });

  it("refuses with no scale", async () => {
    const scale = new MemoryScaleDriver();
    scale.reading = null;
    const refused = { ok: false, error: { code: "unavailable", capability: "serial" } };
    expect(await scale.probe()).toEqual(refused);
    expect(await scale.read()).toEqual(refused);
  });
});
