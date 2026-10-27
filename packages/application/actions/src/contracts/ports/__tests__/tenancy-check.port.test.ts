/**
 * Stackra file contract:
 * Purpose: unit tests of the `TenancyCheck` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver refuses a suspended tenant.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { TenancyCheck } from "#contracts/ports/tenancy-check.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class SuspendedDriver extends Driver(TenancyCheck) {
  async check(target: CallDescriptor): Promise<void> {
    if (target.scopeId === "ten_suspended") throw new Error("tenant_suspended");
  }
}

describe("TenancyCheck", () => {
  it("is an abstract port", () => {
    expect(TenancyCheck.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new SuspendedDriver();
    await expect(driver.check(call)).resolves.toBeUndefined();
    await expect(driver.check({ ...call, scopeId: "ten_suspended" })).rejects.toThrow(
      "tenant_suspended",
    );
  });
});
