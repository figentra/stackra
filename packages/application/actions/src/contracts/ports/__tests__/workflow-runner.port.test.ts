/**
 * Stackra file contract:
 * Purpose: unit tests of the `WorkflowRunner` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver runs a workflow for a call and delivers a signal.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { WorkflowRunner } from "#contracts/ports/workflow-runner.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class EchoDriver extends Driver(WorkflowRunner) {
  readonly signals: unknown[] = [];

  async run(workflow: AnyClass, input: unknown, target: CallDescriptor): Promise<unknown> {
    return { workflow: workflow.name, input, parent: target.callId };
  }

  async signal(signal: AnyClass, payload: object, correlation: object | undefined): Promise<void> {
    this.signals.push([signal.name, payload, correlation]);
  }
}

describe("WorkflowRunner", () => {
  it("is an abstract port", () => {
    expect(WorkflowRunner.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    class RedeemWorkflow {}
    class Confirmed {}
    const driver = new EchoDriver();
    expect(await driver.run(RedeemWorkflow, { points: 1 }, call)).toEqual({
      workflow: "RedeemWorkflow",
      input: { points: 1 },
      parent: "call_1",
    });
    await driver.signal(Confirmed, { reference: "r1" }, { reference: "r1" });
    expect(driver.signals).toEqual([["Confirmed", { reference: "r1" }, { reference: "r1" }]]);
  });
});
