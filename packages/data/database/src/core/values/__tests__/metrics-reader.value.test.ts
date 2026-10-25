/**
 * Stackra file contract:
 * Purpose: unit tests of `MetricsReader`: `count` and `sum` select the period and the previous period in one
 *          statement with bound instants, a money sum over two currencies is refused, `series` fills one bucket per
 *          day for both periods, and a given filter (the visibility conditions `CrudService` adds) replaces `where`.
 * Boundary: test only; a recording query builder stands in for the ORM and returns canned rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rules 15 and 16); ADR 0160; ADR 0022; ADR 0269.
 */
import type { RawQueryFragment } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Aggregate } from "#core/enums/aggregate.enum";
import { MixedCurrencyError } from "#core/errors/mixed-currency.error";
import { MetricsReader } from "#core/values/metrics-reader.value";

class Order extends Model.with(HasPublicId("ord")) {
  status = "paid";

  paidAt: Date | null = null;
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
    total: {
      embeddedProps: {
        minor: { fieldNames: ["total_minor"] },
        currency: { fieldNames: ["total_currency"] },
      },
    },
  },
};

/** A reader over a builder that returns `result`. */
function readerReturning(result: unknown) {
  const builder = {
    select: vi.fn((_fields: RawQueryFragment[]) => builder),
    where: vi.fn(() => builder),
    andWhere: vi.fn(() => builder),
    groupBy: vi.fn(() => builder),
    execute: vi.fn(async () => result),
  };
  const em = { getMetadata: () => metadata, createQueryBuilder: vi.fn(() => builder) };
  const reader = new MetricsReader(em as unknown as EntityManager, Order, period, {
    on: "paidAt",
    where: { status: "paid" },
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
    const { reader } = readerReturning([
      { is_current: true, bucket: 0, value: "2" },
      { is_current: true, bucket: 2, value: "5" },
      { is_current: false, bucket: 1, value: "3" },
      { is_current: false, bucket: 9, value: "7" },
    ]);
    expect(await reader.series(Aggregate.Count)).toEqual({
      current: [2, 0, 5],
      previous: [0, 3, 0],
    });
    await expect(reader.series(Aggregate.Sum)).rejects.toThrow(/needs the summed path/);
  });

  it("reads the rows that count through the filter it was given", async () => {
    const { builder, em } = readerReturning({ current: "1", previous: "0" });
    const visible = { $and: [{ status: "paid" }, { status: "visible" }] };
    const reader = new MetricsReader(
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
          on: "status",
        }),
    ).toThrow(/not a single-column field/);
  });
});
