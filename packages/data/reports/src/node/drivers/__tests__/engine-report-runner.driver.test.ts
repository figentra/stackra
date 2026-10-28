/**
 * Stackra file contract:
 * Purpose: unit tests of `EngineReportRunnerDriver`: a run hands the report's declaration, its registered source model
 *          (found on an ancestor too), the request and the call's time zone (UTC outside a call) to the engine and
 *          returns its result; a class that is no report or has no registered source is refused; columns the call's
 *          actor does not hold, and classified ones, are dropped before the engine sees the request, and with no
 *          decision point or no actor every restricted column is dropped.
 * Boundary: test only; the engine and the call context are recording stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0470 (decisions 3, 6 and 8).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { ForbiddenError } from "@stackra/errors";
import type { PolicyDecisionPointService } from "@stackra/iam";
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

class GuardedSalesReport extends Report<OrderShape & { email: string; margin: number }>({
  key: "guarded_sales",
  dimensions: { status: { path: "status" }, email: { path: "email", dataClass: "personal" } },
  measures: {
    orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
    margin: {
      kind: MeasureKind.Sum,
      field: "margin",
      metric: ReportMetric.Number,
      permission: "orders.order.margin",
    },
  },
}) {}

registerReportSources([
  [OrderSalesReport, Order],
  [GuardedSalesReport, Order],
]);

const answer = { rows: [{ status: "paid", orders: 2 }], totals: { orders: 2 }, cursor: null };

/** A runner over a recording engine, a call context and a decision point holding `held`. */
function runnerWith(context: object | undefined, held?: readonly string[]) {
  const engine = { run: vi.fn(async () => answer) };
  const storage = { current: () => context };
  const policy =
    held === undefined
      ? undefined
      : { check: vi.fn(async (_actor: unknown, key: string) => held.includes(key)) };
  const runner = new EngineReportRunnerDriver(
    engine as unknown as ReportEngine,
    storage as unknown as ContextStorage,
    policy as unknown as PolicyDecisionPointService | undefined,
  );
  return { runner, engine, policy };
}

const guarded = {
  dimensions: [{ name: "status" }, { name: "email" }],
  measures: ["orders", "margin"],
};

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

  it("refuses a report with no registered source and a class that is no report", async () => {
    const { runner, engine } = runnerWith(undefined);
    await expect(
      runner.run(UnregisteredReport, { dimensions: [], measures: ["orders"] }),
    ).rejects.toThrow(/registerReportSources/);
    await expect(
      runner.run(Order as unknown as ReportClass, { dimensions: [], measures: ["orders"] }),
    ).rejects.toThrow(/extends no Report/);
    expect(engine.run).not.toHaveBeenCalled();
  });

  it("drops the columns the caller may not see", async () => {
    const actor = { kind: "user", id: "usr_ana" };
    const scope = { kind: "branch", id: "brn_1" };
    const { runner, engine, policy } = runnerWith({ actor, scope }, []);
    await runner.run(GuardedSalesReport, guarded);
    expect(policy?.check).toHaveBeenCalledWith(actor, "orders.order.margin", { scope });
    expect(engine.run).toHaveBeenCalledWith(
      expect.objectContaining({
        request: { dimensions: [{ name: "status" }], measures: ["orders"] },
      }),
    );
  });

  it("keeps a permission column the caller holds, never a classified one without a permission", async () => {
    const { runner, engine } = runnerWith({ actor: { kind: "user", id: "usr_ana" } }, [
      "orders.order.margin",
    ]);
    await runner.run(GuardedSalesReport, guarded);
    expect(engine.run).toHaveBeenCalledWith(
      expect.objectContaining({
        request: { dimensions: [{ name: "status" }], measures: ["orders", "margin"] },
      }),
    );
  });

  it("fails closed without a decision point and forbids a filter on a hidden column", async () => {
    const { runner, engine } = runnerWith({ actor: { kind: "user", id: "usr_ana" } });
    await runner.run(GuardedSalesReport, guarded);
    expect(engine.run).toHaveBeenCalledWith(
      expect.objectContaining({
        request: { dimensions: [{ name: "status" }], measures: ["orders"] },
      }),
    );
    await expect(
      runner.run(GuardedSalesReport, { ...guarded, filters: { email: "a@b.c" } }),
    ).rejects.toThrow(ForbiddenError);
  });
});
