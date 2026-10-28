/**
 * Stackra file contract:
 * Purpose: unit tests of `reportResultOf`: grouped rows become the page's groups and the grand total, numbers are
 *          numbers, money is `{ minor, currency }`, instants are ISO text, the extra row gives the next cursor (none at
 *          the row cap), a run with no dimension returns its one row, two currencies are refused, subtotals keep only
 *          the page's prefixes, and a pivot becomes a matrix with its margins, null for an empty cell, refused past the
 *          row cap.
 * Boundary: test only; pure, with hand-written statement rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 3); ADR 0307 (rule 16).
 */
import { MixedCurrencyError } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import { PAGE_CURSOR } from "#node/constants/page-cursor.constant";
import { ReportRequestInvalidError } from "#node/errors/report-request-invalid.error";
import { reportResultOf } from "#node/functions/report-result-of.function";
import type { ReportPlan } from "#node/types/report-plan.type";

const declaration: ReportDeclaration = {
  key: "order_sales",
  dimensions: { placedAt: { path: "placedAt" } },
  measures: {
    orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
    revenue: { kind: MeasureKind.Sum, field: "total", metric: ReportMetric.Money },
  },
  defaultFilter: {},
};

const plan: ReportPlan = {
  report: "order_sales",
  dimensions: ["placedAt"],
  measures: ["orders", "revenue"],
  money: ["revenue"],
  moneyOut: ["revenue"],
  selects: [],
  groupBy: "grouping sets ((x), ())",
  offset: 0,
  limit: 1,
};

const day = new Date("2026-10-01T00:00:00Z");
const group = (rank: number) => ({
  placedAt: day,
  orders: "2",
  revenue: "1500",
  "revenue~currency": "SAR",
  "revenue~currencies": "1",
  "~grouping": 0,
  "~rank": rank,
});
const total = { ...group(1), placedAt: null, orders: "3", revenue: "2000", "~grouping": 1 };

/** A statement row of the two-dimension report. */
const row = (region: string | null, status: string | null, orders: number, mask: number) => ({
  region,
  status,
  orders: String(orders),
  "~grouping": mask,
  "~rank": 1,
});

describe(reportResultOf, () => {
  it("returns the page's groups, the grand total and the next cursor", () => {
    expect(reportResultOf(plan, declaration, [group(1), group(2), total], 1000)).toEqual({
      rows: [{ placedAt: day.toISOString(), orders: 2, revenue: { minor: 1500, currency: "SAR" } }],
      totals: { orders: 3, revenue: { minor: 2000, currency: "SAR" } },
      cursor: PAGE_CURSOR.encode(1),
    });
  });

  it("stops the cursor at the row cap and on the last page", () => {
    expect(reportResultOf(plan, declaration, [group(1), group(2), total], 1).cursor).toBeNull();
    expect(reportResultOf(plan, declaration, [group(1), total], 1000).cursor).toBeNull();
  });

  it("returns the one row of a run with no dimension", () => {
    const { report, measures, money, moneyOut, selects, offset, limit } = plan;
    const flat: ReportPlan = {
      report,
      dimensions: [],
      measures,
      money,
      moneyOut,
      selects,
      offset,
      limit,
    };
    const result = reportResultOf(flat, declaration, [total], 1000);
    expect(result.rows).toEqual([result.totals]);
  });

  it("refuses two currencies", () => {
    expect(() =>
      reportResultOf(plan, declaration, [group(1), { ...total, "revenue~currencies": "2" }], 1000),
    ).toThrow(MixedCurrencyError);
  });

  describe("with two dimensions", () => {
    const counts: ReportDeclaration = {
      key: "order_sales",
      dimensions: { region: { path: "region" }, status: { path: "status" } },
      measures: { orders: { kind: MeasureKind.Count, metric: ReportMetric.Count } },
      defaultFilter: {},
    };
    const two: ReportPlan = {
      report: "order_sales",
      dimensions: ["region", "status"],
      measures: ["orders"],
      money: [],
      moneyOut: [],
      selects: [],
      groupBy: "grouping sets (...)",
      offset: 0,
      limit: 2,
    };

    it("keeps the subtotals of the page's prefixes", () => {
      const result = reportResultOf(
        { ...two, subtotals: true },
        counts,
        [
          row("eu", "paid", 3, 0),
          row("eu", "open", 1, 0),
          row("eu", null, 4, 1),
          row("us", null, 9, 1),
          row(null, null, 13, 3),
        ],
        1000,
      );
      expect(result.rows).toHaveLength(2);
      expect(result.subtotals).toEqual([{ level: 1, values: { region: "eu", orders: 4 } }]);
      expect(result.totals).toEqual({ orders: 13 });
    });

    it("lays a pivot out as a matrix with its margins", () => {
      const pivot = { rows: ["region"], columns: ["status"] };
      const result = reportResultOf(
        { ...two, pivot, limit: 1000 },
        counts,
        [
          row("eu", "paid", 3, 0),
          row("eu", "open", 1, 0),
          row("us", "paid", 9, 0),
          row("eu", null, 4, 1),
          row("us", null, 9, 1),
          row(null, "paid", 12, 2),
          row(null, "open", 1, 2),
          row(null, null, 13, 3),
        ],
        1000,
      );
      expect(result.cursor).toBeNull();
      expect(result.pivot).toEqual({
        rows: [["eu"], ["us"]],
        columns: [["paid"], ["open"]],
        cells: [
          [{ orders: 3 }, { orders: 1 }],
          [{ orders: 9 }, null],
        ],
        rowTotals: [{ orders: 4 }, { orders: 9 }],
        columnTotals: [{ orders: 12 }, { orders: 1 }],
      });
      expect(result.totals).toEqual({ orders: 13 });
    });

    it("refuses a pivot past the row cap", () => {
      const pivot = { rows: ["region"], columns: ["status"] };
      expect(() =>
        reportResultOf(
          { ...two, pivot, limit: 1 },
          counts,
          [row("eu", "paid", 3, 0), row("eu", "open", 1, 0), row(null, null, 4, 3)],
          1,
        ),
      ).toThrow(ReportRequestInvalidError);
    });
  });
});
