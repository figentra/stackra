/**
 * Stackra file contract:
 * Purpose: unit tests of `runWorkflow`: it runs a workflow on the current testing app's engine and resolves to its
 *          output and journal record, or to its refusal with the compensated record; it refuses before any app
 *          compiled.
 * Boundary: test only; the plugin compiles a stand-in testing app that binds the clock and the workflow instances.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { StepStatus, Workflow, WorkflowRunStatus } from "#core/index";
import type { Run } from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { WORKFLOW_TESTING_PLUGIN } from "#testing/constants/workflow-testing-plugin.constant";
import { runWorkflow } from "#testing/functions/run-workflow.function";

const clock = { now: () => new Date(Date.UTC(2026, 9, 25, 12)) } as Clock;

class OutOfStockError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

class ReserveWorkflow extends Workflow<{ readonly quantity: number }>({}) {
  async reserve(run: Run<this>): Promise<number> {
    if (run.input.quantity > 5) throw OutOfStockError.create();
    return run.input.quantity;
  }

  output(run: Run<this>): { reserved: number } {
    return { reserved: run.results.reserve };
  }
}

/** Compiles a stand-in testing app over `instances`. */
function compileWith(instances: readonly object[]): void {
  const bound = (token: AnyClass): object | undefined =>
    token === Clock ? clock : instances.find((instance) => instance.constructor === token);
  WORKFLOW_TESTING_PLUGIN.app?.({
    has: (token: AnyClass) => bound(token) !== undefined,
    get: (token: AnyClass) => bound(token),
  } as unknown as TestingApp);
}

describe(runWorkflow, () => {
  it("resolves to the output and the journal record", async () => {
    compileWith([new ReserveWorkflow()]);
    const result = await runWorkflow(ReserveWorkflow, { quantity: 2 });
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ reserved: 2 });
    expect(result.run.status).toBe(WorkflowRunStatus.Completed);
    expect(result.run.origin.actor).toEqual({ kind: "system", id: "sys_test" });
  });

  it("resolves to the refusal and the compensated record", async () => {
    compileWith([new ReserveWorkflow()]);
    const result = await runWorkflow(ReserveWorkflow, { quantity: 9 });
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(OutOfStockError);
    expect(result.run.steps.map((step) => step.status)).toEqual([StepStatus.Failed]);
  });

  it("refuses before any testing app compiled", async () => {
    CURRENT_WORKFLOWS.value = undefined;
    await expect(runWorkflow(ReserveWorkflow, { quantity: 1 })).rejects.toThrow(/No testing app/);
  });
});
