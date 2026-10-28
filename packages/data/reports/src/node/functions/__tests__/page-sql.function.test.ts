/**
 * Stackra file contract:
 * Purpose: unit tests of `pageSql`: an ungrouped plan reads as it is; a grouped plan reads the page plus one and the
 *          grand total; subtotals keep only the prefixes of the page's groups, null-safe; a pivot reads every set up to
 *          the row cap plus one; and no caller value reaches the text.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 3); ADR 0160.
 */
import { describe, expect, it } from "@stackra/testing";

import { pageSql } from "#node/functions/page-sql.function";
import type { ReportPlan } from "#node/types/report-plan.type";

const plan: ReportPlan = {
  report: "order_sales",
  dimensions: ["region", "status", "channel"],
  measures: ["orders"],
  money: [],
  moneyOut: [],
  selects: [],
  groupBy: "grouping sets ((a, b, c), ())",
  offset: 20,
  limit: 10,
};

describe(pageSql, () => {
  it("reads an ungrouped plan as it is", () => {
    const { groupBy: _, ...flat } = plan;
    expect(pageSql(flat, "select inner")).toEqual({ sql: "select inner", params: [] });
  });

  it("reads the page plus one and the grand total", () => {
    expect(pageSql(plan, "select inner")).toEqual({
      sql: 'select * from (select inner) as "report" where "~grouping" <> 0 or ("~rank" > ? and "~rank" <= ?) order by "~grouping", "~rank"',
      params: [20, 31],
    });
  });

  it("keeps the subtotals of the page's prefixes", () => {
    const { sql, params } = pageSql({ ...plan, subtotals: true }, "select inner");
    expect(params).toEqual([20, 31]);
    expect(sql).toContain('with "report" as (select inner)');
    expect(sql).toContain('where "r"."~grouping" = 7 or exists');
    expect(sql).toContain(
      '("r"."~grouping" = 3 and "p"."region" is not distinct from "r"."region")',
    );
    expect(sql).toContain(
      '("r"."~grouping" = 1 and "p"."region" is not distinct from "r"."region" and "p"."status" is not distinct from "r"."status")',
    );
  });

  it("reads a pivot to the row cap plus one", () => {
    const pivot = { rows: ["region"], columns: ["status", "channel"] };
    expect(pageSql({ ...plan, pivot, offset: 0, limit: 1000 }, "select inner")).toEqual({
      sql: 'select * from (select inner) as "report" where "~rank" <= ? order by "~grouping", "~rank"',
      params: [1001],
    });
  });
});
