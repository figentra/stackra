/**
 * Stackra file contract:
 * Purpose: unit tests of the `AccessControl` port: it is an abstract `Port` (its own token, never built directly) and
 *          an iam-style driver allows the permission and refuses a record.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { AccessControl } from "#contracts/ports/access-control.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class AllowListDriver extends Driver(AccessControl) {
  async require(target: CallDescriptor): Promise<void> {
    if (target.actor.kind !== ActorKind.System) throw new Error("forbidden");
  }

  async authorize(_target: CallDescriptor, record: object): Promise<void> {
    if ("locked" in record) throw new Error("forbidden");
  }
}

describe("AccessControl", () => {
  it("is an abstract port", () => {
    expect(AccessControl.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new AllowListDriver();
    await expect(driver.require(call)).resolves.toBeUndefined();
    await expect(driver.authorize(call, {})).resolves.toBeUndefined();
    await expect(driver.authorize(call, { locked: true })).rejects.toThrow("forbidden");
  });
});
