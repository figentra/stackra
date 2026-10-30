/**
 * Stackra file contract:
 * Purpose: unit tests of `hiddenReportColumns`: a permission column hides unless its key is held, a classified column
 *          with no permission always hides, and a formula over a hidden measure hides with it, through other formulas.
 * Boundary: test only; permissions are written as keys, so gen's registry is not read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decision 6); ADR 0341.
 */
import { describe, expect, it } from "@stackra/testing";

import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import { hiddenReportColumns } from "#core/functions/hidden-report-columns.function";
import type { ReportDeclaration } from "#core/types/report-declaration.type";

const declaration: ReportDeclaration = {
  key: "order_sales",
  dimensions: {
    status: { path: "status" },
    email: { path: "customer.email", dataClass: "personal" },
    token: {
      path: "connection.accessToken",
      dataClass: "credential",
      permission: "orders.order.token",
    },
  },
  measures: {
    orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
    margin: {
      kind: MeasureKind.Sum,
      field: "margin",
      metric: ReportMetric.Number,
      permission: "orders.order.margin",
    },
    marginRate: {
      kind: MeasureKind.Formula,
      formula: "margin / orders",
      metric: ReportMetric.Number,
    },
    marginPct: {
      kind: MeasureKind.Formula,
      formula: "marginRate * 100",
      metric: ReportMetric.Percent,
    },
  },
  defaultFilter: {},
};

describe(hiddenReportColumns, () => {
  it("hides unheld, classified and derived columns", () => {
    expect([...hiddenReportColumns(declaration, new Set())].sort()).toEqual([
      "email",
      "margin",
      "marginPct",
      "marginRate",
      "token",
    ]);
    // a credential column stays hidden even when its permission is held (ADR 0494)
    expect([
      ...hiddenReportColumns(declaration, new Set(["orders.order.margin", "orders.order.token"])),
    ]).toEqual(["email", "token"]);
  });
});
