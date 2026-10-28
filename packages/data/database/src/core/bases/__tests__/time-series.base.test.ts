/**
 * Stackra file contract:
 * Purpose: unit tests of `TimeSeries`: a declared series records its checked, frozen options, and a bad key, time
 *          field, dimension, measure, grain, lateness or retention is refused when the class is declared.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; data-layer gap cdc7 (stackra-321).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TimeSeries } from "#core/bases/time-series.base";
import { TimeSeriesBase } from "#core/bases/time-series-base.base";
import { Aggregate } from "#core/enums/aggregate.enum";
import { MetricGrain } from "#core/enums/metric-grain.enum";
import type { TimeSeriesOptions } from "#core/types/time-series-options.type";

interface Reading {
  at: Date;
  scopeId: string;
  meterId: string;
  kwh: number;
}

const valid: TimeSeriesOptions<Reading> = {
  key: "meter_readings",
  time: "at",
  dimensions: ["scopeId", "meterId"],
  measures: {
    kwh: { aggregate: Aggregate.Sum, field: "kwh" },
    readings: { aggregate: Aggregate.Count },
  },
  rollups: [MetricGrain.Hour, MetricGrain.Day],
  retain: { [MetricGrain.Hour]: Duration.days(90) },
};

/** Declares a series with `valid` changed by `change`. */
function declare(change: Partial<Record<keyof TimeSeriesOptions, unknown>>): unknown {
  return TimeSeries<Reading>({ ...valid, ...change } as TimeSeriesOptions<Reading>);
}

describe("TimeSeries", () => {
  it("records the checked options", () => {
    class MeterReadingSeries extends TimeSeries<Reading>(valid) {}
    const series = new MeterReadingSeries();
    expect(series).toBeInstanceOf(TimeSeriesBase);
    expect(series.declaration).toMatchObject({
      key: "meter_readings",
      rollups: ["hour", "day"],
    });
    expect(Object.isFrozen(series.declaration)).toBe(true);
  });

  it("refuses a bad declaration", () => {
    for (const change of [
      { key: "Meter-Readings" },
      { key: "x".repeat(49) },
      { time: undefined },
      { dimensions: ["at"] },
      { dimensions: ["meterId", "meterId"] },
      { measures: {} },
      { measures: { meterId: { aggregate: Aggregate.Count } } },
      { measures: { kwh: { aggregate: "median", field: "kwh" } } },
      { measures: { kwh: { aggregate: Aggregate.Sum } } },
      { measures: { readings: { aggregate: Aggregate.Count, field: "kwh" } } },
      { rollups: [] },
      { rollups: ["minute"] },
      { rollups: [MetricGrain.Day, MetricGrain.Day] },
      { lateness: "soon" },
      { retain: { [MetricGrain.Month]: Duration.days(1) } },
    ])
      expect(() => declare(change), JSON.stringify(change)).toThrow(TypeError);
  });
});
