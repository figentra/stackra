/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDimensionValuesDriver`: nothing is live until projected, a projected value is live in
 *          its dimension only, and a retired value is no longer live.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0351 (decision 4); STA-1708.
 */
import { describe, expect, it } from "@stackra/testing";

import { DimensionValues } from "#contracts/index";
import { MemoryDimensionValuesDriver } from "#core/drivers/memory-dimension-values.driver";

describe("MemoryDimensionValuesDriver", () => {
  it("is a DimensionValues with nothing live until projected", () => {
    const dimensions = new MemoryDimensionValuesDriver();
    expect(dimensions).toBeInstanceOf(DimensionValues);
    expect(dimensions.isLive("channel", "chn_web")).toBe(false);
    expect(dimensions.live("channel")).toEqual([]);
  });

  it("keeps a projected value live in its dimension until it is retired", () => {
    const dimensions = new MemoryDimensionValuesDriver();
    dimensions.project("channel", "chn_web");
    dimensions.project("channel", "chn_pos");
    expect(dimensions.isLive("channel", "chn_web")).toBe(true);
    expect(dimensions.isLive("location", "chn_web")).toBe(false);
    dimensions.retire("channel", "chn_web");
    expect(dimensions.isLive("channel", "chn_web")).toBe(false);
    expect(dimensions.live("channel")).toEqual(["chn_pos"]);
  });
});
