/**
 * Stackra file contract:
 * Purpose: unit tests of `signal`: it holds a signal on the current testing app's engine and resumes the run waiting on
 *          it before it resolves; it refuses before any app compiled.
 * Boundary: test only; the plugin compiles a stand-in testing app that binds the clock and the workflow instance.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0152 (0294 note: signals).
 */
import type { AnyClass } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Signal, Step, Workflow, WorkflowRunStatus } from "#core/index";
import type { Run, StepContext } from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { WORKFLOW_TESTING_PLUGIN } from "#testing/constants/workflow-testing-plugin.constant";
import { runWorkflow } from "#testing/functions/run-workflow.function";
import { signal } from "#testing/functions/signal.function";

const clock = { now: () => new Date(Date.UTC(2026, 9, 25, 12)) } as Clock;

class Shipped extends Signal {
  carrier!: string;
}

class DeliveryWorkflow extends Workflow<{ readonly orderId: string }>({}) {
  @Step<DeliveryWorkflow>({ waitFor: Shipped, correlate: (run) => run.input.orderId })
  async ship(_run: Run<this>, _ctx: StepContext, shipped: Shipped): Promise<string> {
    return shipped.carrier;
  }
}

describe(signal, () => {
  it("resumes the run waiting on the signal", async () => {
    const bound = (token: AnyClass): object | undefined =>
      token === Clock ? clock : token === DeliveryWorkflow ? new DeliveryWorkflow() : undefined;
    WORKFLOW_TESTING_PLUGIN.app?.({
      has: (token: AnyClass) => bound(token) !== undefined,
      get: (token: AnyClass) => bound(token),
    } as unknown as TestingApp);
    const parked = await runWorkflow(DeliveryWorkflow, { orderId: "ord_1" });
    expect(parked.run.status).toBe(WorkflowRunStatus.Waiting);

    await signal(Shipped, { carrier: "aramex" }, "ord_1");

    const run = await CURRENT_WORKFLOWS.value?.runner.last(DeliveryWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(run?.steps[0]?.result).toBe("aramex");
  });

  it("refuses before any testing app compiled", async () => {
    CURRENT_WORKFLOWS.value = undefined;
    await expect(signal(Shipped, { carrier: "aramex" })).rejects.toThrow(/No testing app/);
  });
});
