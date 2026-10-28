/**
 * Stackra file contract:
 * Purpose: unit tests of `Report`: the called form records the `report` kind with the frozen declaration; the instance
 *          reads its key and declaration; every closed-vocabulary refusal (key, empty sections, names, paths, grains,
 *          measure kinds and metrics, fields per kind, money kinds, formulas and their names and cycles, a name used
 *          twice, the default filter) throws a readable TypeError; a bare report base has no declaration.
 * Boundary: test only; the source is a local stand-in for a model.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decisions 1 and 2); ADR 0294 (decision 16).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Report } from "#core/bases/report.base";
import { ReportBase } from "#core/bases/report-base.base";
import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import { TimeGrain } from "#core/enums/time-grain.enum";
import type { ReportOptions } from "#core/types/report-options.type";

interface Order {
  status: string;
  placedAt: Date;
  total: { minor: number; currency: string };
  customerId: string;
  customer: { country: string };
}

class OrderSalesReport extends Report<Order>({
  key: "order_sales",
  dimensions: {
    placedAt: { path: "placedAt", grains: [TimeGrain.Day, TimeGrain.Month] },
    status: { path: "status" },
    country: { path: "customer.country" },
  },
  measures: {
    orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
    revenue: { kind: MeasureKind.Sum, field: "total", metric: ReportMetric.Money },
    buyers: { kind: MeasureKind.CountDistinct, field: "customerId", metric: ReportMetric.Count },
    perBuyer: {
      kind: MeasureKind.Formula,
      formula: "orders / buyers",
      metric: ReportMetric.Number,
    },
  },
  defaultFilter: { status: "paid" },
}) {}

/** Valid options to vary one part of. */
const BASE = {
  key: "order_sales",
  dimensions: { status: { path: "status" } },
  measures: { orders: { kind: MeasureKind.Count, metric: ReportMetric.Count } },
} as const;

/** Declares a report from raw options, bypassing the types, as a hand-written mistake would. */
function declare(options: Record<string, unknown>): void {
  (Report as unknown as (options: Record<string, unknown>) => unknown)(options);
}

describe("Report", () => {
  it("records the report kind with the frozen declaration", () => {
    const record = kindOf(OrderSalesReport);
    expect(record?.kind).toBe("report");
    expect(record?.options).toEqual({
      key: "order_sales",
      dimensions: {
        placedAt: { path: "placedAt", grains: ["day", "month"] },
        status: { path: "status" },
        country: { path: "customer.country" },
      },
      measures: {
        orders: { kind: "count", metric: "count" },
        revenue: { kind: "sum", metric: "money", field: "total" },
        buyers: { kind: "countDistinct", metric: "count", field: "customerId" },
        perBuyer: { kind: "formula", metric: "number", formula: "orders / buyers" },
      },
      defaultFilter: { status: "paid" },
    });
    expect(Object.isFrozen(record?.options)).toBe(true);
    expect(Object.isFrozen(record?.options["measures"])).toBe(true);
  });

  it("reads its key and declaration on the instance", () => {
    const report = new OrderSalesReport();
    expect(report).toBeInstanceOf(ReportBase);
    expect(report.reportKey).toBe("order_sales");
    expect(Object.keys(report.declaration.measures)).toEqual([
      "orders",
      "revenue",
      "buyers",
      "perBuyer",
    ]);
  });

  it("keeps a permission as written", () => {
    const permission = { $permission: "orders.order.report" };
    class Permitted extends Report<Order>({
      ...BASE,
      permission,
    }) {}
    expect(new Permitted().declaration.permission).toBe(permission);
  });

  it("types the source paths", () => {
    expectTypeOf<ReportOptions<Order>["dimensions"][string]["path"]>().toEqualTypeOf<
      | "status"
      | "placedAt"
      | "total"
      | "customerId"
      | "customer"
      | `${"status" | "placedAt" | "total" | "customerId" | "customer"}.${string}`
    >();
  });

  it("has no declaration on a class that extends the base bare", () => {
    class Bare extends ReportBase {}
    expect(() => new Bare().declaration).toThrow(/extends no Report/);
  });

  it.each([
    ["a bad key", { ...BASE, key: "OrderSales" }, /snake_case/],
    ["no dimensions", { ...BASE, dimensions: {} }, /no dimensions/],
    ["no measures", { ...BASE, measures: {} }, /no measures/],
    [
      "a bad dimension name",
      { ...BASE, dimensions: { Status: { path: "status" } } },
      /camelCase name/,
    ],
    ["a bad path", { ...BASE, dimensions: { status: { path: "status; drop" } } }, /field path/],
    [
      "an unknown grain",
      { ...BASE, dimensions: { at: { path: "placedAt", grains: ["minute"] } } },
      /grains/,
    ],
    [
      "a repeated grain",
      { ...BASE, dimensions: { at: { path: "placedAt", grains: ["day", "day"] } } },
      /grains/,
    ],
    ["empty grains", { ...BASE, dimensions: { at: { path: "placedAt", grains: [] } } }, /grains/],
    [
      "an unknown kind",
      { ...BASE, measures: { m: { kind: "median", field: "x", metric: "number" } } },
      /kind is one of/,
    ],
    [
      "an unknown metric",
      { ...BASE, measures: { m: { kind: "count", metric: "euros" } } },
      /metric is one of/,
    ],
    [
      "a count with a field",
      { ...BASE, measures: { m: { kind: "count", field: "x", metric: "count" } } },
      /reads no field/,
    ],
    [
      "a sum without a field",
      { ...BASE, measures: { m: { kind: "sum", metric: "number" } } },
      /needs a field/,
    ],
    [
      "money counted",
      { ...BASE, measures: { m: { kind: "countDistinct", field: "total", metric: "money" } } },
      /money/,
    ],
    [
      "a formula without formula",
      { ...BASE, measures: { m: { kind: "formula", metric: "number" } } },
      /needs `formula`/,
    ],
    [
      "a formula on a sum",
      { ...BASE, measures: { m: { kind: "sum", field: "x", formula: "1", metric: "number" } } },
      /only a formula/,
    ],
    [
      "a formula outside the grammar",
      { ...BASE, measures: { m: { kind: "formula", formula: "sum(x)", metric: "number" } } },
      /does not parse/,
    ],
    [
      "a formula naming an unknown measure",
      { ...BASE, measures: { m: { kind: "formula", formula: "nope * 2", metric: "number" } } },
      /does not declare/,
    ],
    [
      "a formula cycle",
      {
        ...BASE,
        measures: {
          a: { kind: "formula", formula: "b + 1", metric: "number" },
          b: { kind: "formula", formula: "a + 1", metric: "number" },
        },
      },
      /cycle: a -> b -> a/,
    ],
    [
      "a name used twice",
      { ...BASE, measures: { status: { kind: "count", metric: "count" } } },
      /both a dimension and a measure/,
    ],
    ["a bad default filter", { ...BASE, defaultFilter: ["status"] }, /defaultFilter/],
    [
      "a bad default filter path",
      { ...BASE, defaultFilter: { "status or 1": 1 } },
      /defaultFilter/,
    ],
  ])("refuses %s", (_what, options, message) => {
    expect(() => declare(options as Record<string, unknown>)).toThrow(message);
  });
});
