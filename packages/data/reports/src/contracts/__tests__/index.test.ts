/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly its values are exported, `RetentionPeriod` keeps its
 *          closed set, the core report types are assignable to the engine types (so `ReportRunner` hands them on without a cast), and a local engine driver
 *          answers a run.
 * Boundary: test only; the core types are read here, never by the entry itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0470 (decision 8); ADR 0163 (decision 5 as
 *                     amended 2026-10-28).
 */
import { Driver } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import { ReportEngine, RetentionPeriod } from "#contracts/index";
import type {
  ReportEngineDeclaration,
  ReportEngineQuery,
  ReportEngineRequest,
  ReportEngineResult,
} from "#contracts/index";
import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportRequest } from "#core/types/report-request.type";
import type { ReportResult } from "#core/types/report-result.type";

/** An engine that answers the requested measure names, as a test driver would. */
class EchoReportEngineDriver extends Driver(ReportEngine) {
  async run(query: ReportEngineQuery): Promise<ReportEngineResult> {
    return {
      rows: [{ report: query.declaration.key, zone: query.timeZone }],
      totals: Object.fromEntries(query.request.measures.map((name) => [name, 0])),
      cursor: null,
    };
  }
}

describe("@stackra/reports/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "Forecaster",
      "ProductAnalytics",
      "ReportEngine",
      "RetentionPeriod",
    ]);
    expect(Enum.values(RetentionPeriod)).toEqual(["day", "week", "month"]);
  });

  it("takes the core report types as they are", () => {
    expectTypeOf<ReportDeclaration>().toMatchTypeOf<ReportEngineDeclaration>();
    expectTypeOf<ReportRequest>().toMatchTypeOf<ReportEngineRequest>();
    expectTypeOf<ReportEngineResult>().toEqualTypeOf<ReportResult>();
  });

  it("runs a query through a driver", async () => {
    class Order {}
    const result = await new EchoReportEngineDriver().run({
      declaration: { key: "order_sales", dimensions: {}, measures: {}, defaultFilter: {} },
      source: Order,
      request: { dimensions: [], measures: ["orders"] },
      timeZone: "UTC",
    });
    expect(result).toEqual({
      rows: [{ report: "order_sales", zone: "UTC" }],
      totals: { orders: 0 },
      cursor: null,
    });
  });
});
