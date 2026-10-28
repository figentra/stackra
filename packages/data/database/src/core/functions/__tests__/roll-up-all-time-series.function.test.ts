/**
 * Stackra file contract:
 * Purpose: unit tests of `rollUpAllTimeSeries`: it rolls up every registered `TimeSeries` at the given instant and
 *          answers their reports in order.
 * Boundary: test only; `rollUpTimeSeries` is mocked, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; data-layer gap cdc7 (stackra-321).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TIME_SERIES_SOURCES } from "#core/constants/time-series-sources.constant";
import { rollUpAllTimeSeries } from "#core/functions/roll-up-all-time-series.function";
import { rollUpTimeSeries } from "#core/functions/roll-up-time-series.function";
import type { TimeSeriesClass } from "#core/types/time-series-class.type";

vi.mock("#core/functions/roll-up-time-series.function", () => ({
  rollUpTimeSeries: vi.fn(async (series: { readonly name: string }) => ({
    series: series.name,
    tables: [],
  })),
}));

const NOW = new Date("2026-10-28T00:15:00Z");

class Readings {}

class Visits {}

describe("rollUpAllTimeSeries", () => {
  afterEach(() => {
    TIME_SERIES_SOURCES.clear();
  });

  it("rolls up each registered series in turn", async () => {
    for (const series of [Readings, Visits])
      TIME_SERIES_SOURCES.set(series as unknown as TimeSeriesClass, Object);
    expect(await rollUpAllTimeSeries(NOW)).toEqual([
      { series: "Readings", tables: [] },
      { series: "Visits", tables: [] },
    ]);
    expect(rollUpTimeSeries).toHaveBeenCalledWith(Readings, NOW);
    expect(rollUpTimeSeries).toHaveBeenCalledTimes(2);
  });
});
