/**
 * Stackra file contract:
 * Purpose: unit tests of the `FlagCheck` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver refuses a call a flag switches off.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { FlagCheck } from "#contracts/ports/flag-check.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class OffDriver extends Driver(FlagCheck) {
  async check(target: CallDescriptor): Promise<void> {
    if (target.key === "orders.order.create@1") throw new Error("feature_off");
  }
}

describe("FlagCheck", () => {
  it("is an abstract port", () => {
    expect(FlagCheck.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    await expect(new OffDriver().check(call)).rejects.toThrow("feature_off");
  });
});
