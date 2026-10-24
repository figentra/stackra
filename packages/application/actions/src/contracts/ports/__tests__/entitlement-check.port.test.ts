/**
 * Stackra file contract:
 * Purpose: unit tests of the `EntitlementCheck` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver refuses a key the plan lacks.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { EntitlementCheck } from "#contracts/ports/entitlement-check.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class PlanDriver extends Driver(EntitlementCheck) {
  async check(target: CallDescriptor): Promise<void> {
    if (target.key.startsWith("reports.")) throw new Error("entitlement_required");
  }
}

describe("EntitlementCheck", () => {
  it("is an abstract port", () => {
    expect(EntitlementCheck.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new PlanDriver();
    await expect(driver.check(call)).resolves.toBeUndefined();
    await expect(driver.check({ ...call, key: "reports.report.export@1" })).rejects.toThrow(
      "entitlement_required",
    );
  });
});
