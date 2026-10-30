/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryForecasterDriver` and the query check it shares with the `http` driver: the last value
 *          is carried forward with a band, timestamps step by hour, day, week and calendar month from the series' last
 *          timestamp, each requested model gets a row (AutoETS by default, no band for CrostonOptimized), and every
 *          malformed query (horizon, frequency, models, series count, id, length, points, values) is refused.
 * Boundary: test only; no I/O.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0492 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { Forecaster } from "#contracts/ports/forecaster.port";
import type { ForecastQuery } from "#contracts/types/forecast-query.type";
import { MemoryForecasterDriver } from "#node/drivers/memory-forecaster.driver";
import { ForecastQueryInvalidError } from "#node/errors/forecast-query-invalid.error";

const SERIES = {
  id: "sku-1",
  timestamps: ["2026-10-29", "2026-10-30", "2026-10-31"],
  values: [10, 12, 14],
};
const QUERY: ForecastQuery = { series: [SERIES], horizon: 2, frequency: "D" };

/** The two steps forecast after `last` at `frequency`. */
async function stamps(frequency: ForecastQuery["frequency"], last: string) {
  const [row] = await new MemoryForecasterDriver().forecast({
    series: [{ ...SERIES, timestamps: [last, last, last] }],
    horizon: 2,
    frequency,
  });
  return row?.timestamps;
}

describe(MemoryForecasterDriver, () => {
  it("carries the last value forward with a band from the mean step change", async () => {
    const driver = new MemoryForecasterDriver();
    expect(driver).toBeInstanceOf(Forecaster);
    const [row, ...rest] = await driver.forecast(QUERY);
    expect(rest).toEqual([]);
    expect(row).toEqual({
      id: "sku-1",
      model: "AutoETS",
      timestamps: ["2026-11-01T00:00:00", "2026-11-02T00:00:00"],
      mean: [14, 14],
      lo80: [14 - 2 * 1.2816, 14 - 2 * 1.2816],
      hi80: [14 + 2 * 1.2816, 14 + 2 * 1.2816],
    });
  });

  it("answers one row per series and requested model, Croston with no band", async () => {
    const rows = await new MemoryForecasterDriver().forecast({
      ...QUERY,
      series: [SERIES, { ...SERIES, id: "sku-2" }],
      models: ["AutoARIMA", "CrostonOptimized"],
    });
    expect(rows.map((row) => [row.id, row.model])).toEqual([
      ["sku-1", "AutoARIMA"],
      ["sku-1", "CrostonOptimized"],
      ["sku-2", "AutoARIMA"],
      ["sku-2", "CrostonOptimized"],
    ]);
    expect(rows[1]?.lo80).toEqual(rows[1]?.mean);
    expect(rows[1]?.hi80).toEqual(rows[1]?.mean);
  });

  it("steps by hour, week and calendar month", async () => {
    expect(await stamps("H", "2026-10-31T22:00:00")).toEqual([
      "2026-10-31T23:00:00",
      "2026-11-01T00:00:00",
    ]);
    expect(await stamps("W", "2026-10-31")).toEqual(["2026-11-07T00:00:00", "2026-11-14T00:00:00"]);
    expect(await stamps("M", "2026-11-01")).toEqual(["2026-12-01T00:00:00", "2027-01-01T00:00:00"]);
  });

  it("refuses a malformed query", async () => {
    const driver = new MemoryForecasterDriver();
    const bad: Partial<ForecastQuery>[] = [
      { horizon: 0 },
      { horizon: 367 },
      { horizon: 1.5 },
      { frequency: "Q" as ForecastQuery["frequency"] },
      { models: [] },
      { models: ["Prophet" as never] },
      { series: [] },
      { series: [SERIES, SERIES] },
      { series: [{ ...SERIES, id: "" }] },
      { series: [{ ...SERIES, timestamps: ["2026-10-29"] }] },
      { series: [{ id: "s", timestamps: ["a", "b"], values: [1, 2] }] },
      { series: [{ ...SERIES, values: [1, Number.NaN, 3] }] },
    ];
    for (const change of bad)
      await expect(driver.forecast({ ...QUERY, ...change })).rejects.toBeInstanceOf(
        ForecastQueryInvalidError,
      );
  });
});
