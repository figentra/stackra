/**
 * Stackra file contract:
 * Purpose: unit tests of `rollUpTimeSeries`, `registerTimeSeries` and `rollupTable`: per grain, the run finds the
 *          window's first UTC bucket (one grain back by default, or the declared lateness), replaces the window's
 *          buckets in `ts_<key>_<grain>` from the source grouped by the dimensions, prunes a retained grain past its
 *          retention, and refuses a series that is not registered.
 * Boundary: test only; the database is a stand-in whose entity manager records the SQL and its parameters.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; data-layer gap cdc7 (stackra-321).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TimeSeries } from "#core/bases/time-series.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Aggregate } from "#core/enums/aggregate.enum";
import { MetricGrain } from "#core/enums/metric-grain.enum";
import { registerTimeSeries } from "#core/functions/register-time-series.function";
import { rollUpTimeSeries } from "#core/functions/roll-up-time-series.function";
import { rollupTable } from "#core/functions/rollup-table.function";
import { Database } from "#core/ports/database.port";

class MeterReading {
  at = new Date();

  scopeId = "";

  meterId = "";

  kwh = 0;
}

class MeterReadingSeries extends TimeSeries<MeterReading>({
  key: "meter_readings",
  time: "at",
  dimensions: ["scopeId", "meterId"],
  measures: {
    totalKwh: { aggregate: Aggregate.Sum, field: "kwh" },
    readings: { aggregate: Aggregate.Count },
    meters: { aggregate: Aggregate.Distinct, field: "meterId" },
  },
  rollups: [MetricGrain.Hour, MetricGrain.Day],
  lateness: Duration.hours(2),
  retain: { [MetricGrain.Hour]: Duration.days(30) },
}) {}

class UnregisteredSeries extends TimeSeries<MeterReading>({
  key: "unregistered",
  time: "at",
  dimensions: ["meterId"],
  measures: { readings: { aggregate: Aggregate.Count } },
  rollups: [MetricGrain.Day],
}) {}

registerTimeSeries([[MeterReadingSeries, MeterReading]]);

const since = new Date("2026-10-28T10:00:00Z");

/** An entity manager that records each statement and answers the window and the counts. */
function fakeEm() {
  const executed: [string, unknown[]][] = [];
  const em = {
    getMetadata: () => ({
      className: "MeterReading",
      schema: "metering",
      tableName: "meter_readings",
      primaryKeys: ["id"],
      properties: {
        at: { fieldNames: ["at"] },
        scopeId: { fieldNames: ["scope_id"] },
        meterId: { fieldNames: ["meter_id"] },
        kwh: { fieldNames: ["kwh"] },
      },
    }),
    execute: vi.fn(async (sql: string, params: unknown[] = []) => {
      executed.push([sql, params]);
      if (sql.startsWith("select date_trunc")) return [{ since }];
      if (sql.startsWith("with written")) return [{ count: 4 }];
      if (sql.startsWith("with removed")) return [{ count: 7 }];
      return [];
    }),
  };
  return { em, executed };
}

class FakeDatabase extends Database {
  private readonly manager: EntityManager;

  constructor(manager: EntityManager) {
    super();
    this.manager = manager;
  }

  em(): EntityManager {
    return this.manager;
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

const now = new Date("2026-10-28T12:07:00Z");

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe(rollUpTimeSeries, () => {
  it("names each rollup table after the key and the grain", () => {
    expect(rollupTable("meter_readings", MetricGrain.Hour)).toBe("ts_meter_readings_hour");
  });

  it("replaces the window's buckets per grain and prunes a retained grain", async () => {
    const { em, executed } = fakeEm();
    ACTIVE_DATABASE.current = new FakeDatabase(em as unknown as EntityManager);
    const report = await rollUpTimeSeries(MeterReadingSeries, now);
    expect(report).toEqual({
      series: "meter_readings",
      tables: [
        { table: "metering.ts_meter_readings_hour", written: 4, pruned: 7 },
        { table: "metering.ts_meter_readings_day", written: 4, pruned: 0 },
      ],
    });
    expect(executed[0]).toEqual([
      "select date_trunc(?, ?::timestamptz - 7200000 * interval '1 millisecond', 'UTC') as since",
      ["hour", now.toISOString()],
    ]);
    expect(executed[1]).toEqual([
      'delete from "metering"."ts_meter_readings_hour" where "bucket" >= ?',
      [since],
    ]);
    expect(executed[2]).toEqual([
      'with written as (insert into "metering"."ts_meter_readings_hour" ("bucket", "scope_id", "meter_id", "total_kwh", "readings", "meters") select date_trunc(?, "at", \'UTC\'), "scope_id", "meter_id", sum("kwh"), count(*), count(distinct "meter_id") from "metering"."meter_readings" where "at" >= ? group by 1, "scope_id", "meter_id" returning 1) select count(*)::int as count from written',
      ["hour", since],
    ]);
    expect(executed[3]).toEqual([
      'with removed as (delete from "metering"."ts_meter_readings_hour" where "bucket" < ? returning 1) select count(*)::int as count from removed',
      [new Date("2026-09-28T12:07:00Z")],
    ]);
    expect(executed.some(([sql]) => sql.includes("removed") && sql.includes("_day"))).toBe(false);
  });

  it("refuses a series that is not registered", async () => {
    ACTIVE_DATABASE.current = new FakeDatabase(fakeEm().em as unknown as EntityManager);
    await expect(rollUpTimeSeries(UnregisteredSeries, now)).rejects.toThrow(TypeError);
  });
});
