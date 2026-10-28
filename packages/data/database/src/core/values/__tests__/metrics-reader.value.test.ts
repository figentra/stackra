/**
 * Stackra file contract:
 * Purpose: unit tests of `MetricsReader`: `count` and `sum` select the period and the previous period in one
 *          statement with bound instants, a money sum over two currencies is refused, `value` writes the average,
 *          minimum, maximum and distinct count, `series` fills one bucket per day (or the grain's bucket) for both
 *          periods with the grain and time zone bound, `breakdown` groups by a dimension largest first, and a given
 *          filter (the visibility conditions `CrudService` adds) replaces `where`.
 * Boundary: test only; a recording query builder stands in for the ORM and returns canned rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rules 15 and 16); ADR 0160; ADR 0022; ADR 0269; reporting gap 10.
 */
import type { RawQueryFragment } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Aggregate } from "#core/enums/aggregate.enum";
import { MetricGrain } from "#core/enums/metric-grain.enum";
import { MixedCurrencyError } from "#core/errors/mixed-currency.error";
import { MetricsReader } from "#core/values/metrics-reader.value";

class Order extends Model.with(HasPublicId("ord")) {
  status = "paid";

  paidAt: Date | null = null;

  channel = "web";
}

const period = {
  from: new Date("2026-10-08T00:00:00Z"),
  to: new Date("2026-10-11T00:00:00Z"),
  days: 3,
  previous: { from: new Date("2026-10-05T00:00:00Z"), to: new Date("2026-10-08T00:00:00Z") },
};

const metadata = {
  className: "Order",
  properties: {
    paidAt: { fieldNames: ["paid_at"] },
    channel: { fieldNames: ["channel"] },
    status: { fieldNames: ["status"] },
    total: {
      embeddedProps: {
        minor: { fieldNames: ["total_minor"] },
        currency: { fieldNames: ["total_currency"] },
      },
    },
  },
};

/** A reader over a builder that returns `result`. */
function readerReturning(result: unknown, timeZone?: string) {
  const builder = {
    select: vi.fn((_fields: RawQueryFragment[]) => builder),
    where: vi.fn(() => builder),
    andWhere: vi.fn(() => builder),
    groupBy: vi.fn(() => builder),
    orderBy: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    execute: vi.fn(async () => result),
  };
  const em = { getMetadata: () => metadata, createQueryBuilder: vi.fn(() => builder) };
  const reader = new MetricsReader(em as unknown as EntityManager, Order, period, {
    on: "paidAt",
    where: { status: "paid" },
    ...(timeZone === undefined ? {} : { timeZone }),
  });
  return { reader, builder, em };
}

describe(MetricsReader, () => {
  it("counts both periods in one statement", async () => {
    const { reader, builder, em } = readerReturning({ current: "4", previous: "2" });
    expect(await reader.count()).toEqual({ current: 4, previous: 2 });
    expect(em.createQueryBuilder).toHaveBeenCalledWith(Order, "row");
    expect(builder.where).toHaveBeenCalledWith({ status: "paid" });
    const [current, previous] = builder.select.mock.calls[0]?.[0] ?? [];
    expect(current?.sql).toBe(
      'count(*) filter (where row."paid_at" >= cast(? as timestamptz) and row."paid_at" < cast(? as timestamptz)) as current',
    );
    expect(current?.params).toEqual([period.from, period.to]);
    expect(previous?.params).toEqual([period.previous.from, period.previous.to]);
  });

  it("sums a money amount and refuses two currencies", async () => {
    const one = readerReturning({ current: "1500", previous: "900", currencies: "1" });
    expect(await one.reader.sum("total.minor")).toEqual({ current: 1500, previous: 900 });
    const two = readerReturning({ current: "1500", previous: "900", currencies: "2" });
    await expect(two.reader.sum("total.minor")).rejects.toBeInstanceOf(MixedCurrencyError);
  });

  it("buckets each day of both periods", async () => {
    const { reader, builder } = readerReturning([
      { is_current: true, bucket: "2026-10-08 00:00", value: "2" },
      { is_current: true, bucket: "2026-10-10 00:00", value: "5" },
      { is_current: false, bucket: "2026-10-06 00:00", value: "3" },
      { is_current: false, bucket: "2026-09-01 00:00", value: "7" },
    ]);
    expect(await reader.series(Aggregate.Count)).toEqual({
      current: [2, 0, 5],
      previous: [0, 3, 0],
    });
    const [, bucket] = builder.select.mock.calls[0]?.[0] ?? [];
    expect(bucket?.sql).toBe(
      `to_char(date_trunc(?, row."paid_at" at time zone ?), 'YYYY-MM-DD HH24:MI') as bucket`,
    );
    expect(bucket?.params).toEqual(["day", "UTC"]);
    await expect(reader.series(Aggregate.Sum)).rejects.toThrow(/needs the path it aggregates/);
  });

  it("buckets by a grain in the reader's time zone", async () => {
    const { reader, builder } = readerReturning(
      [{ is_current: true, bucket: "2026-10-05 00:00", value: "4" }],
      "Asia/Riyadh",
    );
    // Riyadh is UTC+3: the period is 2026-10-08 03:00 to 2026-10-11 03:00 local, all in the week of Monday 5 October.
    expect(await reader.series(Aggregate.Avg, "total.minor", MetricGrain.Week)).toEqual({
      current: [4],
      previous: [0],
    });
    const [, bucket, value] = builder.select.mock.calls[0]?.[0] ?? [];
    expect(bucket?.params).toEqual(["week", "Asia/Riyadh"]);
    expect(value?.sql).toBe('coalesce(avg(row."total_minor"), 0) as value');
  });

  it("writes the average, minimum, maximum and distinct count over both periods", async () => {
    const { reader, builder } = readerReturning({ current: "3", previous: "1", currencies: "1" });
    expect(await reader.value(Aggregate.Distinct, "channel")).toEqual({ current: 3, previous: 1 });
    await reader.value(Aggregate.Max, "total.minor");
    const sqls = builder.select.mock.calls.map((call) => call[0]?.[0]?.sql);
    expect(sqls[0]).toMatch(/^count\(distinct row\."channel"\) filter \(where /);
    expect(sqls[1]).toMatch(
      /^coalesce\(max\(row\."total_minor"\) filter \(where .*\), 0\) as current$/,
    );
    expect(builder.select.mock.calls[1]?.[0]?.[2]?.sql).toBe(
      'count(distinct row."total_currency") as currencies',
    );
    await expect(reader.value(Aggregate.Min)).rejects.toThrow(/needs the path/);
  });

  it("breaks a metric down by a dimension, largest first", async () => {
    const { reader, builder } = readerReturning([
      { key: "web", current: "9", previous: "4" },
      { key: null, current: "1", previous: "0" },
    ]);
    expect(await reader.breakdown("channel", Aggregate.Count, undefined, 5)).toEqual([
      { key: "web", current: 9, previous: 4 },
      { key: null, current: 1, previous: 0 },
    ]);
    expect(builder.select.mock.calls[0]?.[0]?.[0]?.sql).toBe('row."channel" as key');
    expect(builder.limit).toHaveBeenCalledWith(5);
    await expect(reader.breakdown("channel", Aggregate.Count, undefined, 0)).rejects.toThrow(
      /whole number of groups/,
    );
    const mixed = readerReturning([{ key: "web", current: "1", previous: "1", currencies: "2" }]);
    await expect(
      mixed.reader.breakdown("channel", Aggregate.Sum, "total.minor"),
    ).rejects.toBeInstanceOf(MixedCurrencyError);
  });

  it("reads the rows that count through the filter it was given", async () => {
    const { builder, em } = readerReturning({ current: "1", previous: "0" });
    const visible = { $and: [{ status: "paid" }, { status: "visible" }] };
    const reader = new MetricsReader<Order>(
      em as unknown as EntityManager,
      Order,
      period,
      { on: "paidAt", where: { status: "paid" } },
      async () => visible,
    );
    expect(await reader.count()).toEqual({ current: 1, previous: 0 });
    expect(builder.where).toHaveBeenLastCalledWith(visible);
  });

  it("refuses an instant field that is not a column", () => {
    const em = { getMetadata: () => metadata, createQueryBuilder: vi.fn() };
    expect(
      () =>
        new MetricsReader(em as unknown as EntityManager, Order, period, {
          on: "missing" as "paidAt",
        }),
    ).toThrow(/not a single-column field/);
  });
});
