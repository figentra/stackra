/**
 * Stackra file contract:
 * Purpose: unit tests of `EngineReportRunnerDriver`: a run hands the report's declaration, its registered source model
 *          (found on an ancestor too), the request and the call's time zone (UTC outside a call) to the engine and
 *          returns its result; a class that is no report or has no registered source is refused.
 * Boundary: test only; the engine and the call context are recording stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decisions 3 and 8).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { ReportEngine } from "#contracts/ports/report-engine.port";
import { Report } from "#core/bases/report.base";
import { MeasureKind } from "#core/enums/measure-kind.enum";
import { ReportMetric } from "#core/enums/report-metric.enum";
import type { ReportClass } from "#core/types/report-class.type";
import { EngineReportRunnerDriver } from "#node/drivers/engine-report-runner.driver";
import { registerReportSources } from "#node/functions/register-report-sources.function";

interface OrderShape {
  status: string;
}

class Order {}

class OrderSalesReport extends Report<OrderShape>({
  key: "order_sales",
  dimensions: { status: { path: "status" } },
  measures: { orders: { kind: MeasureKind.Count, metric: ReportMetric.Count } },
}) {}

class PaidOrderSalesReport extends OrderSalesReport {}

class UnregisteredReport extends Report<OrderShape>({
  key: "unregistered",
  dimensions: { status: { path: "status" } },
  measures: { orders: { kind: MeasureKind.Count, metric: ReportMetric.Count } },
}) {}

registerReportSources([[OrderSalesReport, Order]]);

const answer = { rows: [{ status: "paid", orders: 2 }], totals: { orders: 2 }, cursor: null };

/** A runner over a recording engine and a call context. */
function runnerWith(context: object | undefined) {
  const engine = { run: vi.fn(async () => answer) };
  const storage = { current: () => context };
  const runner = new EngineReportRunnerDriver(
    engine as unknown as ReportEngine,
    storage as unknown as ContextStorage,
  );
  return { runner, engine };
}

describe(EngineReportRunnerDriver, () => {
  it("hands the declaration, source, request and time zone to the engine", async () => {
    const { runner, engine } = runnerWith({ timeZone: "Asia/Riyadh" });
    const request = { dimensions: [{ name: "status" }], measures: ["orders"] };
    await expect(runner.run(OrderSalesReport, request)).resolves.toBe(answer);
    expect(engine.run).toHaveBeenCalledWith({
      declaration: expect.objectContaining({ key: "order_sales" }),
      source: Order,
      request,
      timeZone: "Asia/Riyadh",
    });
  });

  it("finds the source on an ancestor and buckets in UTC outside a call", async () => {
    const { runner, engine } = runnerWith(undefined);
    await runner.run(PaidOrderSalesReport, { dimensions: [], measures: ["orders"] });
    expect(engine.run).toHaveBeenCalledWith(
      expect.objectContaining({ source: Order, timeZone: "UTC" }),
    );
  });

  it("refuses a report with no registered source and a class that is no report", () => {
    const { runner, engine } = runnerWith(undefined);
    expect(() => runner.run(UnregisteredReport, { dimensions: [], measures: ["orders"] })).toThrow(
      /registerReportSources/,
    );
    expect(() =>
      runner.run(Order as unknown as ReportClass, { dimensions: [], measures: ["orders"] }),
    ).toThrow(/extends no Report/);
    expect(engine.run).not.toHaveBeenCalled();
  });
});
