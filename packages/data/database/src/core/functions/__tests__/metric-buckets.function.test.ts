/**
 * Stackra file contract:
 * Purpose: unit tests of `metricBuckets`: a window's bucket keys at each grain in a time zone, oldest first; a local
 *          day across a daylight-saving change stays one bucket; a window not on a boundary touches its first
 *          partial bucket; an hourly series over years is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rule 16); ADR 0136 (decision 1); ADR 0022; reporting gap 10.
 */
import { describe, expect, it } from "@stackra/testing";

import { MetricGrain } from "#core/enums/metric-grain.enum";
import { metricBuckets } from "#core/functions/metric-buckets.function";

describe(metricBuckets, () => {
  it("lists the local days of a window in its time zone", () => {
    expect(
      metricBuckets(
        new Date("2026-10-24T21:00:00Z"),
        new Date("2026-10-26T21:00:00Z"),
        MetricGrain.Day,
        "Asia/Riyadh",
      ),
    ).toEqual(["2026-10-25 00:00", "2026-10-26 00:00"]);
  });

  it("keeps a day across a daylight-saving change one bucket", () => {
    // Berlin falls back on 25 October 2026: that local day is 25 hours long.
    expect(
      metricBuckets(
        new Date("2026-10-24T22:00:00Z"),
        new Date("2026-10-26T23:00:00Z"),
        MetricGrain.Day,
        "Europe/Berlin",
      ),
    ).toEqual(["2026-10-25 00:00", "2026-10-26 00:00"]);
  });

  it("buckets by hour, week, month and quarter", () => {
    const from = new Date("2026-10-08T10:30:00Z");
    expect(metricBuckets(from, new Date("2026-10-08T13:00:00Z"), MetricGrain.Hour, "UTC")).toEqual([
      "2026-10-08 10:00",
      "2026-10-08 11:00",
      "2026-10-08 12:00",
    ]);
    expect(metricBuckets(from, new Date("2026-10-20T00:00:00Z"), MetricGrain.Week, "UTC")).toEqual([
      "2026-10-05 00:00",
      "2026-10-12 00:00",
      "2026-10-19 00:00",
    ]);
    expect(metricBuckets(from, new Date("2026-12-01T00:00:00Z"), MetricGrain.Month, "UTC")).toEqual(
      ["2026-10-01 00:00", "2026-11-01 00:00"],
    );
    expect(
      metricBuckets(new Date("2026-02-10T00:00:00Z"), from, MetricGrain.Quarter, "UTC"),
    ).toEqual(["2026-01-01 00:00", "2026-04-01 00:00", "2026-07-01 00:00", "2026-10-01 00:00"]);
  });

  it("refuses a series of more than 5,000 buckets", () => {
    expect(() =>
      metricBuckets(
        new Date("2020-01-01T00:00:00Z"),
        new Date("2026-01-01T00:00:00Z"),
        MetricGrain.Hour,
        "UTC",
      ),
    ).toThrow(RangeError);
  });
});
