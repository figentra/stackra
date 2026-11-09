/**
 * Stackra file contract:
 * Purpose: unit tests of `StartTriggeredAutomationsAction`: a queued job on the default queue with exponential retries
 *          and a dead letter; it asks `AutomationService.triggered` with `last` from `ctx.attempt` (false on an attempt
 *          a retry follows, true on the last one and on a direct call), and starts nothing with another engine bound.
 * Boundary: test only; the automations are a recording stand-in that triggers none, so no run starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0122 (decision 3).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import type { WorkflowRunner } from "@stackra/actions/contracts";
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { NativeWorkflowRunnerDriver } from "#core/index";
import { StartTriggeredAutomationsAction } from "#node/actions/start-triggered-automations.action";
import { StartTriggeredAutomationsInput } from "#node/schemas/start-triggered-automations-input.schema";
import type { AutomationService } from "#node/services/automation.service";

/** The occurrence every case starts, as the validated input the pipeline hands `handle`. */
const INPUT = Object.assign(new StartTriggeredAutomationsInput(), {
  block: "orders.order_paid",
  eventId: "evt_1",
  occurrence: { orderId: "ord_1" },
});

/** An action over a recording `triggered` and a runner of the given class. */
function actionWith(runner: object) {
  const triggered = vi.fn(async () => []);
  const action = new StartTriggeredAutomationsAction(
    { triggered } as unknown as AutomationService,
    runner as WorkflowRunner,
  );
  return { action, triggered };
}

/** A native engine that is never driven: the recording automations trigger none. */
const native = (): object => Object.create(NativeWorkflowRunnerDriver.prototype) as object;

describe(StartTriggeredAutomationsAction, () => {
  it("is a retried job on the default queue", () => {
    expect(kindOf(StartTriggeredAutomationsAction)).toMatchObject({
      options: {
        key: "automation.start_triggered",
        job: { queue: "default", retries: 6, deadLetter: true },
      },
    });
  });

  it("passes last from the job's attempt, and last on a direct call", async () => {
    const { action, triggered } = actionWith(native());
    await action.handle(INPUT, fakeActionContext({ attempt: { number: 1, last: false } }));
    await action.handle(INPUT, fakeActionContext({ attempt: { number: 7, last: true } }));
    await action.handle(INPUT, fakeActionContext());
    expect(triggered.mock.calls.map((call) => (call as unknown[])[2])).toEqual([
      { last: false },
      { last: true },
      { last: true },
    ]);
  });

  it("starts nothing when another engine is bound", async () => {
    const { action, triggered } = actionWith({});
    await action.handle(INPUT, fakeActionContext());
    expect(triggered).not.toHaveBeenCalled();
  });
});
