/**
 * Stackra file contract:
 * Purpose: unit tests of `compileReport`: dimensions (with a grain bucketed in the time zone) and measures (formulas
 *          inlined, money with its currency check) become one select list with grouping sets for the grand totals and
 *          a rank in the requested sort; the default filter and the request's filters become bound conditions; the
 *          page is capped by the row cap and the cursor; and every undeclared name, grain, sort, pivot axis, bad
 *          limit, foreign cursor or bad time zone is refused with `report_request_invalid`.
 * Boundary: test only; pure, with a column resolver that maps a path to `row."<path>"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decisions 2 and 3); ADR 0160.
 */
import { describe, expect, it } from "@stackra/testing";

import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import { TimeGrain } from "#core/enums/time-grain.enum";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportRequest } from "#core/types/report-request.type";
import { PAGE_CURSOR } from "#node/constants/page-cursor.constant";
import { ReportRequestInvalidError } from "#node/errors/report-request-invalid.error";
import { compileReport } from "#node/functions/compile-report.function";

const declaration: ReportDeclaration = {
  key: "order_sales",
  dimensions: {
    placedAt: { path: "placedAt", grains: [TimeGrain.Day, TimeGrain.Month] },
    status: { path: "status" },
  },
  measures: {
    orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
    revenue: { kind: MeasureKind.Sum, field: "total", metric: ReportMetric.Money },
    perOrder: {
      kind: MeasureKind.Formula,
      formula: "revenue / orders",
      metric: ReportMetric.Number,
    },
  },
  defaultFilter: { status: "paid" },
};

const options = {
  column: (path: string): string => `row."${path.replaceAll(".", "_")}"`,
  timeZone: "Asia/Riyadh",
  pageSize: 50,
  maxRows: 1000,
};

const compile = (request: ReportRequest, more: Partial<typeof options> = {}) =>
  compileReport(declaration, request, { ...options, ...more });

describe(compileReport, () => {
  it("groups by bucketed dimensions with grand totals in one select", () => {
    const plan = compile({
      dimensions: [{ name: "placedAt", grain: TimeGrain.Month }, { name: "status" }],
      measures: ["orders", "revenue"],
      sort: [{ key: "revenue", direction: "desc" }],
    });
    const month = `date_trunc('month', row."placedAt", 'Asia/Riyadh')`;
    const dims = `${month}, row."status"`;
    expect(plan.selects).toEqual([
      `${month} as "placedAt"`,
      'row."status" as "status"',
      'count(*) as "orders"',
      'coalesce(sum(row."total_minor"), 0) as "revenue"',
      'min(row."total_currency") as "revenue~currency"',
      'count(distinct row."total_currency") as "revenue~currencies"',
      `grouping(${dims}) as "~grouping"`,
      `row_number() over (partition by grouping(${dims}) order by coalesce(sum(row."total_minor"), 0) desc, ${month} asc, row."status" asc) as "~rank"`,
    ]);
    expect(plan.groupBy).toBe(`grouping sets ((${dims}), ())`);
    expect(plan.money).toEqual(["revenue"]);
    expect(plan.moneyOut).toEqual(["revenue"]);
    expect(plan.selects.join(" ")).not.toContain("?");
  });

  it("inlines a formula and checks the money it reads", () => {
    const plan = compile({ dimensions: [], measures: ["perOrder"] });
    expect(plan.selects[0]).toBe(
      '(coalesce(sum(row."total_minor"), 0))::numeric / nullif((count(*))::numeric, 0) as "perOrder"',
    );
    expect(plan.money).toEqual(["revenue"]);
    expect(plan.moneyOut).toEqual([]);
    expect(plan.groupBy).toBeUndefined();
  });

  it("binds the default filter and the request's filters", () => {
    const plan = compile({
      dimensions: [{ name: "status" }],
      measures: ["orders"],
      filters: { placedAt: { op: "dateRange", from: "2026-10-01" }, status: ["paid", "refunded"] },
    });
    expect(plan.where).toEqual({
      sql: '(row."status" = ?) and (row."placedAt" >= ?) and (row."status" in (?, ?))',
      params: ["paid", new Date("2026-10-01T00:00:00Z"), "paid", "refunded"],
    });
  });

  it("caps the page by the row cap and reads the cursor", () => {
    expect(compile({ dimensions: [], measures: ["orders"] }).limit).toBe(50);
    expect(compile({ dimensions: [], measures: ["orders"], limit: 5000 }).limit).toBe(1000);
    const plan = compile({
      dimensions: [],
      measures: ["orders"],
      limit: 100,
      cursor: PAGE_CURSOR.encode(950),
    });
    expect([plan.offset, plan.limit]).toEqual([950, 50]);
  });

  it("refuses what the report does not declare", () => {
    const bad: ReportRequest[] = [
      { dimensions: [], measures: [] },
      { dimensions: [], measures: ["margin"] },
      { dimensions: [{ name: "country" }], measures: ["orders"] },
      { dimensions: [{ name: "placedAt" }], measures: ["orders"] },
      { dimensions: [{ name: "placedAt", grain: TimeGrain.Year }], measures: ["orders"] },
      { dimensions: [{ name: "status", grain: TimeGrain.Day }], measures: ["orders"] },
      { dimensions: [{ name: "status" }, { name: "status" }], measures: ["orders"] },
      { dimensions: [], measures: ["orders"], filters: { total: 1 } },
      { dimensions: [], measures: ["orders"], sort: [{ key: "revenue", direction: "asc" }] },
      { dimensions: [], measures: ["orders"], pivot: { rows: ["status"], columns: [] } },
      { dimensions: [], measures: ["orders"], limit: 0 },
      { dimensions: [], measures: ["orders"], cursor: "not-ours" },
      { dimensions: [], measures: ["orders"], cursor: PAGE_CURSOR.encode(1000) },
    ];
    for (const request of bad) expect(() => compile(request)).toThrow(ReportRequestInvalidError);
    expect(() =>
      compile({ dimensions: [], measures: ["orders"] }, { timeZone: "UTC'; drop" }),
    ).toThrow(ReportRequestInvalidError);
  });
});
