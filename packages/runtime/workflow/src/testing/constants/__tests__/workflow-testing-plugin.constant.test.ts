/**
 * Stackra file contract:
 * Purpose: unit tests of `WORKFLOW_TESTING_PLUGIN`: on compile it uses the app's native engine when bound, else an
 *          in-process one on the memory journal connected to the app; `app.workflows.last` returns the latest run and
 *          refuses a workflow that never ran; `app.workflows.advanceClock` times out a wait.
 * Boundary: test only; a stand-in testing app binds the clock and fixed workflow instances.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3).
 */
import { WorkflowRunner } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";
import type { TestingApp } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";

import {
  MemoryWorkflowJournalDriver,
  NativeWorkflowRunnerDriver,
  Signal,
  Step,
  Workflow,
  WorkflowRunStatus,
} from "#core/index";
import { CURRENT_WORKFLOWS } from "#testing/constants/current-workflows.constant";
import { WORKFLOW_TESTING_PLUGIN } from "#testing/constants/workflow-testing-plugin.constant";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

const clock = { now: () => new Date(NOON) } as Clock;

class Approved extends Signal {}

class ApprovalWorkflow extends Workflow({ timeout: "1h" }) {
  async submit(): Promise<void> {}

  async undoSubmit(): Promise<void> {}

  @Step({ waitFor: Approved, timeout: "15m" })
  async approve(): Promise<void> {}
}

class IdleWorkflow extends Workflow({}) {}

/** A testing app that binds the clock, `instances` and, when given, `runner`. */
function appOf(instances: readonly object[], runner?: NativeWorkflowRunnerDriver): TestingApp {
  const bound = (token: AnyClass): object | undefined =>
    token === Clock
      ? clock
      : token === WorkflowRunner
        ? runner
        : instances.find((instance) => instance.constructor === token);
  return {
    has: (token: AnyClass) => bound(token) !== undefined,
    get: (token: AnyClass) => bound(token),
  } as unknown as TestingApp;
}

/** The members the plugin adds to `app`. */
function compile(app: TestingApp) {
  return WORKFLOW_TESTING_PLUGIN.app?.(app) as TestingApp;
}

describe("WORKFLOW_TESTING_PLUGIN", () => {
  it("is the @stackra/workflow plugin", () => {
    expect(WORKFLOW_TESTING_PLUGIN.name).toBe("@stackra/workflow");
  });

  it("uses the app's native engine when bound", () => {
    const runner = new NativeWorkflowRunnerDriver(
      new MemoryWorkflowJournalDriver(),
      new Locks(new MemoryLockDriver(clock), clock),
      clock,
    );
    compile(appOf([], runner));
    expect(CURRENT_WORKFLOWS.value?.runner).toBe(runner);
  });

  it("runs an in-process engine and times out a wait with advanceClock", async () => {
    const app = compile(appOf([new ApprovalWorkflow()]));
    const runner = CURRENT_WORKFLOWS.value?.runner;
    await runner?.start(ApprovalWorkflow, undefined, {
      callId: "call-1",
      key: "approval.request",
      actor: { kind: "system", id: "sys_test" },
      locale: "en",
      timeZone: "UTC",
      currency: "USD",
      market: "default",
    });
    expect((await app.workflows.last(ApprovalWorkflow)).status).toBe(WorkflowRunStatus.Waiting);

    await app.workflows.advanceClock("16m");

    const run = await app.workflows.last(ApprovalWorkflow);
    expect(run.status).toBe(WorkflowRunStatus.Compensated);
    expect(run.steps.map((step) => `${step.name}:${step.status}`)).toEqual([
      "submit:compensated",
      "approve:timed_out",
    ]);
  });

  it("refuses last for a workflow that never ran", async () => {
    const app = compile(appOf([]));
    await expect(app.workflows.last(IdleWorkflow)).rejects.toThrow(/has no run/);
  });
});
