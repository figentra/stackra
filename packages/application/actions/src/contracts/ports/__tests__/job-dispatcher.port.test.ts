/**
 * Stackra file contract:
 * Purpose: unit tests of the `JobDispatcher` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver queues an action with its input.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { JobDispatcher } from "#contracts/ports/job-dispatcher.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class ListDriver extends Driver(JobDispatcher) {
  readonly queued: unknown[] = [];

  async dispatch(action: AnyClass, input: unknown, target: CallDescriptor): Promise<void> {
    this.queued.push([action.name, input, target.callId]);
  }
}

describe("JobDispatcher", () => {
  it("is an abstract port", () => {
    expect(JobDispatcher.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    class DeliverMessageAction {}
    const driver = new ListDriver();
    await driver.dispatch(DeliverMessageAction, { messageId: "msg_1" }, call);
    expect(driver.queued).toEqual([["DeliverMessageAction", { messageId: "msg_1" }, "call_1"]]);
  });
});
