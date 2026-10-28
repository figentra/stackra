/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly its values are exported, the vocabulary enums hold their
 *          closed sets, the public types resolve, and a report declared through the entry is a `report` kind a
 *          `ReportRunner` driver can run.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias. The runner is a local `Driver(ReportRunner)`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0470 (decisions 1 to 3).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as reports from "#core/index";
import { MeasureKind, Report, ReportMetric, ReportRunner, TimeGrain } from "#core/index";
import type {
  ReportClass,
  ReportPivot,
  ReportRequest,
  ReportResult,
  ReportSubtotal,
} from "#core/index";

interface Ticket {
  openedAt: Date;
  priority: string;
}

class TicketLoadReport extends Report<Ticket>({
  key: "ticket_load",
  dimensions: {
    openedAt: { path: "openedAt", grains: [TimeGrain.Week] },
    priority: { path: "priority" },
  },
  measures: { tickets: { kind: MeasureKind.Count, metric: ReportMetric.Count } },
}) {}

/** A runner that answers one fixed row, as a test driver would. */
class FixedRunnerDriver extends Driver(ReportRunner) {
  async run(report: ReportClass, request: ReportRequest): Promise<ReportResult> {
    const Declared = report as unknown as new () => { reportKey: string };
    const key = new Declared().reportKey;
    return { rows: [{ report: key, measures: request.measures.length }], totals: {}, cursor: null };
  }
}

describe("@stackra/reports", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(reports).sort()).toEqual([
      "MeasureKind",
      "Report",
      "ReportMetric",
      "ReportRunner",
      "TimeGrain",
      "formulaNames",
      "hiddenReportColumns",
    ]);
    expect("ReportBase" in reports).toBe(false);
  });

  it("keeps the closed vocabularies", () => {
    expect(Enum.values(TimeGrain)).toEqual(["hour", "day", "week", "month", "quarter", "year"]);
    expect(Enum.values(MeasureKind)).toEqual([
      "count",
      "countDistinct",
      "sum",
      "avg",
      "min",
      "max",
      "formula",
    ]);
    expect(Enum.values(ReportMetric)).toEqual(["count", "number", "money", "percent", "duration"]);
  });

  it("runs a declared report through a runner driver", async () => {
    const result = await new FixedRunnerDriver().run(TicketLoadReport, {
      dimensions: [{ name: "openedAt", grain: TimeGrain.Week }],
      measures: ["tickets"],
    });
    expect(result).toEqual({
      rows: [{ report: "ticket_load", measures: 1 }],
      totals: {},
      cursor: null,
    });
    expectTypeOf<ReportRequest["sort"]>().toEqualTypeOf<
      readonly { readonly key: string; readonly direction: "asc" | "desc" }[] | undefined
    >();
    expectTypeOf<ReportResult["cursor"]>().toEqualTypeOf<string | null>();
    expectTypeOf<NonNullable<ReportResult["subtotals"]>[number]>().toEqualTypeOf<ReportSubtotal>();
    expectTypeOf<NonNullable<ReportResult["pivot"]>>().toEqualTypeOf<ReportPivot>();
  });
});
