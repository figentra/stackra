/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresReportEngineDriver`: a run compiles one statement through the query builder (selects,
 *          one where with the bound filters and the visible-keys subquery, grouping sets) and pages it in one execute;
 *          it runs on the replica inside a transaction with the configured timeout, or on the primary when the replica
 *          is off; and the time grain takes the query's time zone.
 * Boundary: test only; the database, entity manager and query builder are recording stand-ins, and
 *           `visibleKeysQuery` is replaced with a canned subquery.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decisions 3 and 8); ADR 0333 (decisions 4 and 5); ADR 0160.
 */
import { Duration } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import { TimeGrain } from "#core/enums/time-grain.enum";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportsConfig } from "#node/config/reports.config";
import { PostgresReportEngineDriver } from "#node/drivers/postgres-report-engine.driver";

vi.mock("@stackra/database", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  visibleKeysQuery: vi.fn(async () => ({
    sql: 'select "visible"."id" from "orders"."orders" as "visible" where "visible"."owner_id" = ?',
    params: ["usr_ana"],
  })),
}));

class Order {}

const declaration: ReportDeclaration = {
  key: "order_sales",
  dimensions: {
    placedAt: { path: "placedAt", grains: [TimeGrain.Month] },
    status: { path: "status" },
  },
  measures: { orders: { kind: MeasureKind.Count, metric: ReportMetric.Count } },
  defaultFilter: { status: "paid" },
};

const meta = {
  className: "Order",
  primaryKeys: ["id"],
  properties: {
    id: { kind: "scalar", fieldNames: ["id"] },
    status: { kind: "scalar", fieldNames: ["status"] },
    placedAt: { kind: "scalar", fieldNames: ["placed_at"] },
  },
};

/** A driver over recording stand-ins. */
function driverWith(replica = true) {
  const qb = {
    leftJoin: vi.fn(() => qb),
    select: vi.fn(() => qb),
    where: vi.fn(() => qb),
    groupBy: vi.fn(() => qb),
    toQuery: vi.fn(() => ({ sql: "select inner", params: ["paid", "usr_ana"] })),
  };
  const rows = [
    {
      placedAt: new Date("2026-10-01T00:00:00Z"),
      status: "paid",
      orders: "4",
      "~grouping": 0,
      "~rank": 1,
    },
    { placedAt: null, status: null, orders: "4", "~grouping": 3, "~rank": 1 },
  ];
  const em = {
    getMetadata: vi.fn(() => meta),
    createQueryBuilder: vi.fn(() => qb),
    execute: vi.fn(async () => rows),
  };
  const database = {
    em: () => em,
    transaction: vi.fn(async (work: () => Promise<unknown>) => work()),
    onReplica: vi.fn(async (work: () => Promise<unknown>) => work()),
  };
  const config = { pageSize: 100, maxRows: 10_000, timeout: Duration.seconds(30), replica };
  const driver = new PostgresReportEngineDriver(
    database as unknown as Database,
    config as unknown as ReportsConfig,
  );
  return { driver, database, em, qb };
}

describe(PostgresReportEngineDriver, () => {
  it("runs one paged statement on the replica with the timeout", async () => {
    const { driver, database, em, qb } = driverWith();
    const result = await driver.run({
      declaration,
      source: Order,
      request: {
        dimensions: [{ name: "placedAt", grain: TimeGrain.Month }, { name: "status" }],
        measures: ["orders"],
      },
      timeZone: "Asia/Riyadh",
    });
    expect(database.onReplica).toHaveBeenCalledOnce();
    expect(database.transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: Duration.seconds(30),
    });
    expect(em.createQueryBuilder).toHaveBeenCalledWith(Order, "row");
    const selects = (qb.select.mock.calls[0] as unknown as [{ sql: string }[]])[0].map(
      (item) => item.sql,
    );
    expect(selects[0]).toBe(`date_trunc('month', row."placed_at", 'Asia/Riyadh') as "placedAt"`);
    expect(qb.where).toHaveBeenCalledWith(
      '(row."status" = ?) and (row."id" in (select "visible"."id" from "orders"."orders" as "visible" where "visible"."owner_id" = ?))',
      ["paid", "usr_ana"],
    );
    expect(qb.groupBy).toHaveBeenCalledOnce();
    expect(em.execute).toHaveBeenCalledOnce();
    expect(em.execute).toHaveBeenCalledWith(
      'select * from (select inner) as "report" where "~grouping" <> 0 or ("~rank" > ? and "~rank" <= ?) order by "~grouping", "~rank"',
      ["paid", "usr_ana", 0, 101],
      "all",
    );
    expect(result).toEqual({
      rows: [{ placedAt: "2026-10-01T00:00:00.000Z", status: "paid", orders: 4 }],
      totals: { orders: 4 },
      cursor: null,
    });
  });

  it("runs on the primary when the replica is off", async () => {
    const { driver, database } = driverWith(false);
    await driver.run({
      declaration,
      source: Order,
      request: { dimensions: [], measures: ["orders"] },
      timeZone: "UTC",
    });
    expect(database.onReplica).not.toHaveBeenCalled();
    expect(database.transaction).toHaveBeenCalledOnce();
  });
});
